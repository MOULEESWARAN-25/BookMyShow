const { lazyQueue, retryOptions } = require("./connection");

const QUEUE_NAME = "search-index";
const getQueue = lazyQueue(QUEUE_NAME);

const addIndexMovieJob = (movieId) =>
  getQueue().add("index-movie", { movieId }, retryOptions(5, 10));

module.exports = { QUEUE_NAME, getQueue, addIndexMovieJob };
