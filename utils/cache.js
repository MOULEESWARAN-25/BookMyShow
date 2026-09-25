const redis = require("../db/redis");
const { redisLogger } = require("./logger");

const CACHE_TTL_SECONDS = 5 * 60;

const moviesCacheKey = () => "cache:movies";
const showsCacheKey = (movieId) => `cache:shows:${movieId}`;

const getCached = async (key, load) => {
  const cached = await redis.get(key);
  if (cached !== null) {
    redisLogger.info(`Cache hit ${key}`);
    return JSON.parse(cached);
  }

  const value = await load();
  if (value !== null) {
    await redis.set(key, JSON.stringify(value), { EX: CACHE_TTL_SECONDS });
    redisLogger.info(`Cache miss ${key}, loaded from database and cached for ${CACHE_TTL_SECONDS}s`);
  }
  return value;
};

const clearCache = async (key) => {
  await redis.del(key);
  redisLogger.info(`Cache cleared ${key}`);
};

module.exports = {
  moviesCacheKey,
  showsCacheKey,
  getCached,
  clearCache,
};
