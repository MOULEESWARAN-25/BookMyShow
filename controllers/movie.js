const { Op, UniqueConstraintError } = require("sequelize");
const { Movie, Show, Theatre } = require("../models");
const { parseId, isNonEmptyString, escapeLike } = require("../utils/validation");
const {
  moviesCacheKey,
  showsCacheKey,
  getCached,
  clearCache,
} = require("../utils/cache");
const { searchMovieIds } = require("../utils/movieSearch");
const { addIndexMovieJob } = require("../queues/searchIndex");
const { logger } = require("../utils/logger");

const MOVIE_ATTRIBUTES = [
  "id",
  "title",
  "description",
  "language",
  "genre",
  "durationMinutes",
  "releaseDate",
  "castMembers",
];

const upcoming = () => ({ startsAt: { [Op.gt]: new Date() }, cancelledAt: null });

const findMovies = async (search, theatre) => {
  let movieWhere = {};
  let rankedIds = null;
  if (isNonEmptyString(search)) {
    try {
      rankedIds = await searchMovieIds(search.trim());
      movieWhere = { id: rankedIds };
    } catch (error) {
      logger.warn(
        `OpenSearch search failed, falling back to Postgres title search: ${error.message}`,
      );
      movieWhere = { title: { [Op.iLike]: `%${escapeLike(search.trim())}%` } };
    }
  }
  const include = isNonEmptyString(theatre)
    ? [
        {
          model: Show,
          attributes: [],
          required: true,
          where: upcoming(),
          include: [
            {
              model: Theatre,
              as: "theatre",
              attributes: [],
              required: true,
              where: {
                name: { [Op.iLike]: `%${escapeLike(theatre.trim())}%` },
              },
            },
          ],
        },
      ]
    : [];

  const movies = await Movie.findAll({
    attributes: MOVIE_ATTRIBUTES,
    where: movieWhere,
    include,
    group: ["Movie.id"],
    order: [["title", "ASC"]],
  });

  if (rankedIds) {
    const rank = new Map(rankedIds.map((id, index) => [id, index]));
    movies.sort((a, b) => rank.get(a.id) - rank.get(b.id));
  }
  return movies;
};

// Only the unfiltered list is cached; search results vary too much to be worth it.
const listMovies = async (req, res) => {
  const { search, theatre } = req.query;

  const movies =
    isNonEmptyString(search) || isNonEmptyString(theatre)
      ? await findMovies(search, theatre)
      : await getCached(moviesCacheKey(), () => findMovies());

  res.status(200).json({ movies });
};

const getMovie = async (req, res) => {
  const movieId = parseId(req.params.movieId);
  if (!movieId) {
    return res
      .status(400)
      .json({ message: "movieId must be a positive integer" });
  }

  const movie = await Movie.findByPk(movieId, { attributes: MOVIE_ATTRIBUTES });
  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  const theatres = await Theatre.findAll({
    attributes: ["id", "name", "city"],
    include: [
      {
        model: Show,
        attributes: [],
        required: true,
        where: { movieId, ...upcoming() },
      },
    ],
    group: ["Theatre.id"],
    order: [["name", "ASC"]],
  });

  res.status(200).json({ movie, theatres });
};

const listShows = async (req, res) => {
  const movieId = parseId(req.params.movieId);
  if (!movieId) {
    return res
      .status(400)
      .json({ message: "movieId must be a positive integer" });
  }

  let theatreId = null;
  if (req.query.theatreId !== undefined) {
    theatreId = parseId(req.query.theatreId);
    if (!theatreId) {
      return res
        .status(400)
        .json({ message: "theatreId must be a positive integer" });
    }
  }

  const allShows = await getCached(showsCacheKey(movieId), async () => {
    const movie = await Movie.findByPk(movieId, { attributes: ["id"] });
    if (!movie) {
      return null;
    }

    return Show.findAll({
      where: { movieId, ...upcoming() },
      attributes: ["id", "startsAt", "endsAt", "price"],
      include: [
        { model: Theatre, as: "theatre", attributes: ["id", "name", "city"] },
      ],
      order: [["startsAt", "ASC"]],
    });
  });
  if (!allShows) {
    return res.status(404).json({ message: "Movie not found" });
  }

  // The cached list can be a few minutes old, so drop shows that have started since.
  const now = new Date();
  const shows = allShows.filter(
    (show) =>
      new Date(show.startsAt) > now &&
      (!theatreId || show.theatre.id === theatreId),
  );

  res.status(200).json({ shows });
};

const duplicateMovie = (res) =>
  res.status(409).json({
    message: "A movie with this title, language and release date already exists",
  });

const movieJson = (movie) =>
  Object.fromEntries(MOVIE_ATTRIBUTES.map((attribute) => [attribute, movie[attribute]]));

const parseMovieFields = (body, { partial }) => {
  const { title, description, language, genre, durationMinutes, releaseDate, castMembers } =
    body || {};
  const has = (value) => value !== undefined;

  for (const [name, value] of [["title", title], ["language", language], ["genre", genre]]) {
    if ((!partial || has(value)) && !isNonEmptyString(value)) {
      return { error: partial ? `${name} cannot be empty` : "title, language, and genre are required" };
    }
  }
  if ((!partial || has(durationMinutes)) && (!Number.isInteger(durationMinutes) || durationMinutes <= 0)) {
    return { error: "durationMinutes must be a positive integer" };
  }
  if (has(description) && description !== null && typeof description !== "string") {
    return { error: "description must be a string" };
  }
  if (
    has(releaseDate) &&
    releaseDate !== null &&
    (typeof releaseDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(releaseDate) ||
      Number.isNaN(Date.parse(releaseDate)))
  ) {
    return { error: "releaseDate must be a date in YYYY-MM-DD format" };
  }
  if (
    has(castMembers) &&
    castMembers !== null &&
    (!Array.isArray(castMembers) || !castMembers.every(isNonEmptyString))
  ) {
    return { error: "castMembers must be an array of names" };
  }

  const values = {};
  if (has(title)) values.title = title.trim();
  if (has(description)) values.description = description?.trim() || null;
  if (has(language)) values.language = language.trim();
  if (has(genre)) values.genre = genre.trim();
  if (has(durationMinutes)) values.durationMinutes = durationMinutes;
  if (has(releaseDate)) values.releaseDate = releaseDate;
  if (has(castMembers)) values.castMembers = castMembers?.map((name) => name.trim()) ?? null;
  if (!partial) {
    values.description ??= null;
    values.releaseDate ??= null;
    values.castMembers ??= null;
  }
  return { values };
};

const afterMovieChange = async (movieId) => {
  await clearCache(moviesCacheKey());
  addIndexMovieJob(movieId).catch((error) => {
    logger.error(`Could not queue search indexing for movie ${movieId}: ${error.message}`);
  });
};

const createMovie = async (req, res) => {
  const { values, error } = parseMovieFields(req.body, { partial: false });
  if (error) {
    return res.status(400).json({ message: error });
  }

  let movie;
  try {
    movie = await Movie.create({ ...values, createdBy: req.user.userId });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return duplicateMovie(res);
    }
    throw error;
  }
  await afterMovieChange(movie.id);

  res.status(201).json({ message: "Movie created successfully", movie: movieJson(movie) });
};

const findOwnMovie = async (req, res) => {
  const movieId = parseId(req.params.movieId);
  if (!movieId) {
    res.status(400).json({ message: "movieId must be a positive integer" });
    return null;
  }
  const movie = await Movie.findByPk(movieId);
  if (!movie) {
    res.status(404).json({ message: "Movie not found" });
    return null;
  }
  if (movie.createdBy !== req.user.userId) {
    res.status(403).json({ message: "You can only change movies you added" });
    return null;
  }
  return movie;
};

const updateMovie = async (req, res) => {
  const { values, error } = parseMovieFields(req.body, { partial: true });
  if (error) {
    return res.status(400).json({ message: error });
  }
  if (Object.keys(values).length === 0) {
    return res.status(400).json({ message: "Send at least one field to change" });
  }

  const movie = await findOwnMovie(req, res);
  if (!movie) return;

  try {
    await movie.update(values);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return duplicateMovie(res);
    }
    throw error;
  }
  await afterMovieChange(movie.id);

  res.status(200).json({ message: "Movie updated successfully", movie: movieJson(movie) });
};

const deleteMovie = async (req, res) => {
  const movie = await findOwnMovie(req, res);
  if (!movie) return;

  const shows = await Show.count({ where: { movieId: movie.id } });
  if (shows > 0) {
    return res.status(409).json({
      message: `This movie has ${shows} show(s), so it is kept for booking history. Delete or cancel its shows first.`,
    });
  }
  await movie.destroy();
  await afterMovieChange(movie.id);
  res.status(200).json({ message: "Movie deleted" });
};

module.exports = {
  listMovies,
  getMovie,
  listShows,
  createMovie,
  updateMovie,
  deleteMovie,
};
