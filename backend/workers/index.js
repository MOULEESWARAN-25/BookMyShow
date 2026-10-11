require("dotenv").config();
const ticketEmailWorker = require("./ticketEmail");
const showReminderWorker = require("./showReminder");
const searchIndexWorker = require("./searchIndex");
const { ensureMoviesIndex } = require("../utils/movieSearch");
const { scheduleUpcomingShowChecks } = require("../queues/showReminder");
const { sequelize } = require("../models");
const { logger } = require("../utils/logger");

scheduleUpcomingShowChecks()
  .then(() => logger.info("Scheduled the upcoming show reminder check to run every minute"))
  .catch((error) =>
    logger.error(`Could not schedule the upcoming show reminder check: ${error.message}`),
  );

ensureMoviesIndex().catch((error) =>
  logger.error(`Could not create the OpenSearch movies index: ${error.message}`),
);

const shutdown = async () => {
  await Promise.all([
    ticketEmailWorker.close(),
    showReminderWorker.close(),
    searchIndexWorker.close(),
  ]);
  await sequelize.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
