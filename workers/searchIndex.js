const { Worker } = require("bullmq");
const { connection } = require("../queues/connection");
const { QUEUE_NAME } = require("../queues/searchIndex");
const { indexMovie } = require("../utils/movieSearch");
const { logger } = require("../utils/logger");

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    await indexMovie(job.data.movieId);
  },
  {
    connection: { ...connection, maxRetriesPerRequest: null },
    concurrency: 5,
  },
);

worker.on("ready", () =>
  logger.info(`Search index worker listening on ${QUEUE_NAME}`),
);

worker.on("failed", (job, error) => {
  const attempts = `${job.attemptsMade}/${job.opts.attempts}`;
  if (job.attemptsMade < job.opts.attempts) {
    logger.warn(
      `Job ${job.id} failed (attempt ${attempts}), retrying: ${error.message}`,
    );
  } else {
    logger.error(
      `Job ${job.id} failed for good after ${attempts} attempts: ${error.message}`,
    );
  }
});

worker.on("error", (error) =>
  logger.error(`Search index worker error: ${error.message}`),
);

module.exports = worker;
