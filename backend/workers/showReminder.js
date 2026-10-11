const createWorker = require("./createWorker");
const { QUEUE_NAME, CHECK_JOB } = require("../queues/showReminder");
const { sendShowReminder } = require("../utils/ticketEmail");
const { queueRemindersForUpcomingShows } = require("../utils/upcomingShowReminders");

module.exports = createWorker(
  QUEUE_NAME,
  "Show reminder",
  (job) =>
    job.name === CHECK_JOB
      ? queueRemindersForUpcomingShows()
      : sendShowReminder(job.data.bookingId),
  { limiter: { max: 10, duration: 1000 } },
);
