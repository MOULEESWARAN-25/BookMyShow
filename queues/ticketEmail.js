const { Queue } = require("bullmq");

const QUEUE_NAME = "ticket-emails";

const redisUrl = new URL(process.env.REDIS_URL || "redis://localhost:6379");
const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
};

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

module.exports = { QUEUE_NAME, connection, addTicketEmailJob };
