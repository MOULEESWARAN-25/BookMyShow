const { Worker } = require("bullmq");
const { connection } = require("../queues/connection");
const { QUEUE_NAME, CHECK_JOB } = require("../queues/showReminder");
const { sendShowReminder } = require("../utils/ticketEmail");
const { queueRemindersForUpcomingShows } = require("../utils/upcomingShowReminders");
const { logger } = require("../utils/logger");

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    if (job.name === CHECK_JOB) {
      return queueRemindersForUpcomingShows();
    }
    await sendShowReminder(job.data.bookingId);
  },
  {
    connection: { ...connection, maxRetriesPerRequest: null },
    concurrency: 5,
    limiter: { max: 10, duration: 1000 },
  },
);

worker.on("ready", () =>
  logger.info(`Show reminder worker listening on ${QUEUE_NAME}`),
);

worker.on("completed", (job) => {
  logger.info(`Job ${job.id} completed after ${job.attemptsMade} attempt(s)`);
});

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
  logger.error(`Show reminder worker error: ${error.message}`),
);

module.exports = worker;
