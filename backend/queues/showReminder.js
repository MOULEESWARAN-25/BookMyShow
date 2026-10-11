const { lazyQueue, retryOptions } = require("./connection");

const QUEUE_NAME = "show-reminders";
const CHECK_JOB = "check-upcoming-shows";
const SEND_JOB = "send-reminder";
const getQueue = lazyQueue(QUEUE_NAME);

const scheduleUpcomingShowChecks = () =>
  getQueue().upsertJobScheduler(
    CHECK_JOB,
    { pattern: "* * * * *" },
    {
      name: CHECK_JOB,
      opts: {
        removeOnComplete: { count: 100 },
        removeOnFail: { age: 7 * 24 * 60 * 60 },
      },
    },
  );

const addReminderEmailJobs = (reminders) =>
  getQueue().addBulk(
    reminders.map(({ bookingId, startsAt }) => ({
      name: SEND_JOB,
      data: { bookingId },
      opts: {
        ...retryOptions(3, 20),
        jobId: `reminder-${bookingId}-${new Date(startsAt).getTime()}`,
      },
    })),
  );

module.exports = {
  QUEUE_NAME,
  CHECK_JOB,
  getQueue,
  scheduleUpcomingShowChecks,
  addReminderEmailJobs,
};
