const { lazyQueue, retryOptions } = require("./connection");

const QUEUE_NAME = "ticket-emails";
const getQueue = lazyQueue(QUEUE_NAME);
const EMAIL_JOB_OPTIONS = retryOptions(5, 10);

const addTicketEmailJob = (bookingId) =>
  getQueue().add(
    "send-ticket",
    { bookingId },
    { ...EMAIL_JOB_OPTIONS, jobId: `booking-${bookingId}` },
  );

const addShowUpdatedEmailJobs = (bookingIds, startsAt) =>
  getQueue().addBulk(
    bookingIds.map((bookingId) => ({
      name: "show-updated",
      data: { bookingId, startsAt: startsAt.toISOString() },
      opts: {
        ...EMAIL_JOB_OPTIONS,
        jobId: `show-updated-${bookingId}-${startsAt.getTime()}`,
      },
    })),
  );

const addShowCancelledEmailJobs = (bookingIds) =>
  getQueue().addBulk(
    bookingIds.map((bookingId) => ({
      name: "show-cancelled",
      data: { bookingId },
      opts: { ...EMAIL_JOB_OPTIONS, jobId: `show-cancelled-${bookingId}` },
    })),
  );

module.exports = {
  QUEUE_NAME,
  getQueue,
  addTicketEmailJob,
  addShowUpdatedEmailJobs,
  addShowCancelledEmailJobs,
};
