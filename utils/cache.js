const redis = require("../db/redis");

const CACHE_TTL_SECONDS = 5 * 60;

const moviesCacheKey = () => "cache:movies";
const showsCacheKey = (movieId) => `cache:shows:${movieId}`;

const getCached = async (key, load) => {
  const cached = await redis.get(key);
  if (cached !== null) {
    return JSON.parse(cached);
  }

  const value = await load();
  if (value !== null) {
    await redis.set(key, JSON.stringify(value), { EX: CACHE_TTL_SECONDS });
  }
  return value;
};

const clearCache = async (key) => {
  await redis.del(key);
};

module.exports = {
  moviesCacheKey,
  showsCacheKey,
  getCached,
  clearCache,
};
