const opensearch = require("../db/opensearch");
const { Movie } = require("../models");
const { logger } = require("./logger");

const INDEX = "movies";
const MAX_RESULTS = 50;

const searchAsYouType = { type: "search_as_you_type" };
const textWithKeyword = { type: "text", fields: { keyword: { type: "keyword" } } };

const INDEX_DEFINITION = {
  settings: { number_of_shards: 1, number_of_replicas: 0 },
  mappings: {
    properties: {
      title: { type: "text", fields: { suggest: searchAsYouType } },
      castMembers: { type: "text", fields: { suggest: searchAsYouType } },
      description: { type: "text", analyzer: "english" },
      language: textWithKeyword,
      genre: textWithKeyword,
      releaseDate: { type: "date" },
      durationMinutes: { type: "integer" },
    },
  },
};

const ensureMoviesIndex = async () => {
  const { body: exists } = await opensearch.indices.exists({ index: INDEX });
  if (!exists) {
    await opensearch.indices.create({ index: INDEX, body: INDEX_DEFINITION });
    logger.info(`Created OpenSearch index "${INDEX}"`);
  }
};

const toDocument = (movie) => ({
  title: movie.title,
  castMembers: movie.castMembers ?? [],
  description: movie.description,
  language: movie.language,
  genre: movie.genre,
  releaseDate: movie.releaseDate,
  durationMinutes: movie.durationMinutes,
});

const indexMovie = async (movieId) => {
  const movie = await Movie.findByPk(movieId);
  if (!movie) {
    await opensearch.delete(
      { index: INDEX, id: String(movieId), refresh: true },
      { ignore: [404] },
    );
    logger.info(`Movie ${movieId} no longer exists, removed from search`);
    return;
  }
  await opensearch.index({
    index: INDEX,
    id: String(movie.id),
    body: toDocument(movie),
    refresh: true,
  });
  logger.info(`Movie ${movie.id} indexed for search`);
};

const reindexAllMovies = async () => {
  await ensureMoviesIndex();
  const movies = await Movie.findAll({ order: [["id", "ASC"]] });
  if (movies.length === 0) {
    return 0;
  }
  const body = movies.flatMap((movie) => [
    { index: { _index: INDEX, _id: String(movie.id) } },
    toDocument(movie),
  ]);
  const { body: result } = await opensearch.bulk({ body, refresh: true });
  if (result.errors) {
    const failed = result.items.filter((item) => item.index.error);
    throw new Error(`${failed.length} movie(s) failed to index: ${failed[0].index.error.reason}`);
  }
  return movies.length;
};

const SUGGEST_FIELDS = (field) => [
  `${field}.suggest`,
  `${field}.suggest._2gram`,
  `${field}.suggest._3gram`,
];

const searchMovieIds = async (text) => {
  const { body } = await opensearch.search({
    index: INDEX,
    body: {
      size: MAX_RESULTS,
      _source: false,
      query: {
        bool: {
          should: [
            {
              multi_match: {
                query: text,
                fields: ["title^3", "castMembers^2", "genre", "language", "description"],
                fuzziness: "AUTO",
              },
            },
            {
              multi_match: {
                query: text,
                type: "bool_prefix",
                fields: [...SUGGEST_FIELDS("title"), ...SUGGEST_FIELDS("castMembers")],
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
    },
  });
  return body.hits.hits.map((hit) => Number(hit._id));
};

module.exports = { ensureMoviesIndex, indexMovie, reindexAllMovies, searchMovieIds };
