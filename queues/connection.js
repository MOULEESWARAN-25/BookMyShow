const { Queue } = require("bullmq");

const redisUrl = new URL(process.env.REDIS_URL || "redis://localhost:6379");

const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined,
};

const JOB_RETENTION = {
  removeOnComplete: { age: 24 * 60 * 60 },
  removeOnFail: { age: 7 * 24 * 60 * 60 },
};

const retryOptions = (attempts, delaySeconds) => ({
  attempts,
  backoff: { type: "exponential", delay: delaySeconds * 1000 },
  ...JOB_RETENTION,
});

const lazyQueue = (name) => {
  let queue;
  return () => {
    queue ??= new Queue(name, {
      connection: { ...connection, enableOfflineQueue: false },
    });
    return queue;
  };
};

module.exports = { connection, retryOptions, lazyQueue };
