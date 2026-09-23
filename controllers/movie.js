const { Op } = require("sequelize");
const { Movie, Show, Theatre } = require("../models");
const { parseId, isNonEmptyString, escapeLike } = require("../utils/validation");

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

const upcoming = () => ({ startsAt: { [Op.gt]: new Date() } });

const listMovies = async (req, res) => {
  const { search, theatre } = req.query;

  const movieWhere = isNonEmptyString(search)
    ? { title: { [Op.iLike]: `%${escapeLike(search.trim())}%` } }
    : {};
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

  const where = { movieId, ...upcoming() };
  if (req.query.theatreId !== undefined) {
    const theatreId = parseId(req.query.theatreId);
    if (!theatreId) {
      return res
        .status(400)
        .json({ message: "theatreId must be a positive integer" });
    }
    where.theatreId = theatreId;
  }

  const movie = await Movie.findByPk(movieId, { attributes: ["id"] });
  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  const shows = await Show.findAll({
    where,
    attributes: ["id", "startsAt", "endsAt", "price"],
    include: [
      { model: Theatre, as: "theatre", attributes: ["id", "name", "city"] },
    ],
    order: [["startsAt", "ASC"]],
  });

  res.status(200).json({ shows });
};

const createMovie = async (req, res) => {
  const {
    title,
    description,
    language,
    genre,
    durationMinutes,
    releaseDate,
    castMembers,
  } = req.body || {};

  if (![title, language, genre].every(isNonEmptyString)) {
    return res
      .status(400)
      .json({ message: "title, language, and genre are required" });
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    return res
      .status(400)
      .json({ message: "durationMinutes must be a positive integer" });
  }

  if (description !== undefined && typeof description !== "string") {
    return res.status(400).json({ message: "description must be a string" });
  }

  if (
    releaseDate !== undefined &&
    (typeof releaseDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(releaseDate) ||
      Number.isNaN(Date.parse(releaseDate)))
  ) {
    return res
      .status(400)
      .json({ message: "releaseDate must be a date in YYYY-MM-DD format" });
  }

  if (
    castMembers !== undefined &&
    (!Array.isArray(castMembers) || !castMembers.every(isNonEmptyString))
  ) {
    return res
      .status(400)
      .json({ message: "castMembers must be an array of names" });
  }

  const movie = await Movie.create({
    title: title.trim(),
    description: description?.trim() || null,
    language: language.trim(),
    genre: genre.trim(),
    durationMinutes,
    releaseDate: releaseDate ?? null,
    castMembers: castMembers?.map((name) => name.trim()) ?? null,
    createdBy: req.user.userId,
  });

  res.status(201).json({
    message: "Movie created successfully",
    movie: Object.fromEntries(
      MOVIE_ATTRIBUTES.map((attribute) => [attribute, movie[attribute]]),
    ),
  });
};

module.exports = {
  listMovies,
  getMovie,
  listShows,
  createMovie,
};
