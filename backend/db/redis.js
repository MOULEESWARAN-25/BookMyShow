const { createClient } = require("redis");
const { redisLogger } = require("../utils/logger");

const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redis.on("ready", () => redisLogger.info("Connected to Redis"));
redis.on("reconnecting", () => redisLogger.warn("Reconnecting to Redis"));
redis.on("end", () => redisLogger.info("Redis connection closed"));
redis.on("error", (error) => redisLogger.error(`Redis error: ${error.message}`));

module.exports = redis;
