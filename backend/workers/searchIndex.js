const createWorker = require("./createWorker");
const { QUEUE_NAME } = require("../queues/searchIndex");
const { indexMovie } = require("../utils/movieSearch");

module.exports = createWorker(QUEUE_NAME, "Search index", (job) =>
  indexMovie(job.data.movieId),
);
