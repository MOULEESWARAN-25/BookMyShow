const { Queue } = require("bullmq");
const { connection } = require("./connection");

const QUEUE_NAME = "show-reminders";
const CHECK_JOB = "check-upcoming-shows";
const SEND_JOB = "send-reminder";

let queue;
const getQueue = () => {
  queue ??= new Queue(QUEUE_NAME, {
    connection: { ...connection, enableOfflineQueue: false },
  });
  return queue;
};

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

const addReminderEmailJobs = (bookingIds) =>
  getQueue().addBulk(
    bookingIds.map((bookingId) => ({
      name: SEND_JOB,
      data: { bookingId },
      opts: {
        jobId: `reminder-${bookingId}`,
        attempts: 3,
        backoff: { type: "exponential", delay: 20 * 1000 },
        removeOnComplete: { age: 24 * 60 * 60 },
        removeOnFail: { age: 7 * 24 * 60 * 60 },
      },
    })),
  );

module.exports = {
  QUEUE_NAME,
  CHECK_JOB,
  SEND_JOB,
  getQueue,
  scheduleUpcomingShowChecks,
  addReminderEmailJobs,
};
