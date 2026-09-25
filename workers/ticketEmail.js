require("dotenv").config();
const { Worker } = require("bullmq");
const { QUEUE_NAME, connection } = require("../queues/ticketEmail");
const { sendBookingTicket } = require("../utils/ticketEmail");
const { sequelize } = require("../models");
const { logger } = require("../utils/logger");

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    await sendBookingTicket(job.data.bookingId);
  },
  {
    connection: { ...connection, maxRetriesPerRequest: null },
    concurrency: 5,
  },
);

worker.on("ready", () => logger.info(`Ticket email worker listening on ${QUEUE_NAME}`));

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

worker.on("error", (error) => logger.error(`Ticket email worker error: ${error.message}`));

const shutdown = async () => {
  await worker.close();
  await sequelize.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
