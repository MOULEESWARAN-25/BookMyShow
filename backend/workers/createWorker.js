const { Worker } = require("bullmq");
const { connection } = require("../queues/connection");
const { logger } = require("../utils/logger");

const createWorker = (queueName, label, processor, options = {}) => {
  const worker = new Worker(queueName, processor, {
    connection: { ...connection, maxRetriesPerRequest: null },
    concurrency: 5,
    ...options,
  });

  worker.on("ready", () => logger.info(`${label} worker listening on ${queueName}`));

  worker.on("completed", (job) => {
    logger.info(`Job ${job.id} completed after ${job.attemptsMade} attempt(s)`);
  });

  worker.on("failed", (job, error) => {
    const attempts = `${job.attemptsMade}/${job.opts.attempts}`;
    if (job.attemptsMade < job.opts.attempts) {
      logger.warn(`Job ${job.id} failed (attempt ${attempts}), retrying: ${error.message}`);
    } else {
      logger.error(`Job ${job.id} failed for good after ${attempts} attempts: ${error.message}`);
    }
  });

  worker.on("error", (error) => logger.error(`${label} worker error: ${error.message}`));

  return worker;
};

module.exports = createWorker;
