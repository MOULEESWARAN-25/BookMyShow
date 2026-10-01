const { Queue } = require("bullmq");
const { connection } = require("./connection");

const QUEUE_NAME = "ticket-emails";

let queue;
const getQueue = () => {
  queue ??= new Queue(QUEUE_NAME, {
    connection: { ...connection, enableOfflineQueue: false },
  });
  return queue;
};

const addTicketEmailJob = (bookingId) =>
  getQueue().add(
    "send-ticket",
    { bookingId },
    {
      jobId: `booking-${bookingId}`,
      attempts: 5,
      backoff: { type: "exponential", delay: 10 * 1000 },
      removeOnComplete: { age: 24 * 60 * 60 },
      removeOnFail: { age: 7 * 24 * 60 * 60 },
    },
  );

module.exports = { QUEUE_NAME, getQueue, addTicketEmailJob };
