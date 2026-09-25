const redis = require("../db/redis");
const { redisLogger } = require("./logger");

const SESSION_TTL_SECONDS = 30 * 60;
const MAX_ACTIVE_SESSIONS = 3;

const sessionKey = (token) => `session:${token}`;
const userSessionsKey = (userId) => `user_sessions:${userId}`;

const createSession = async (userId, token) => {
  const now = Date.now();
  const userKey = userSessionsKey(userId);

  await redis.zRemRangeByScore(userKey, "-inf", now);
  const activeTokens = await redis.zRange(userKey, 0, -1);

  const transaction = redis.multi();
  let evictedCount = 0;
  if (activeTokens.length >= MAX_ACTIVE_SESSIONS) {
    const tokensToEvict = activeTokens.slice(
      0,
      activeTokens.length - MAX_ACTIVE_SESSIONS + 1,
    );
    transaction.del(tokensToEvict.map(sessionKey));
    transaction.zRem(userKey, tokensToEvict);
    evictedCount = tokensToEvict.length;
  }
  transaction.set(sessionKey(token), String(userId), { EX: SESSION_TTL_SECONDS });
  transaction.zAdd(userKey, {
    score: now + SESSION_TTL_SECONDS * 1000,
    value: token,
  });
  transaction.expire(userKey, SESSION_TTL_SECONDS);
  await transaction.exec();

  const activeCount = activeTokens.length - evictedCount + 1;
  redisLogger.info(
    `Session created for user ${userId} (${activeCount}/${MAX_ACTIVE_SESSIONS} active)`,
  );
  if (evictedCount > 0) {
    redisLogger.warn(
      `Logged out ${evictedCount} oldest session(s) for user ${userId}: more than ${MAX_ACTIVE_SESSIONS} devices`,
    );
  }
};

const getSessionUserId = async (token) => {
  const userId = await redis.get(sessionKey(token));
  return userId === null ? null : Number(userId);
};

const deleteSession = async (userId, token) => {
  await redis
    .multi()
    .del(sessionKey(token))
    .zRem(userSessionsKey(userId), token)
    .exec();
  redisLogger.info(`Session deleted for user ${userId} (logout)`);
};

module.exports = {
  SESSION_TTL_SECONDS,
  createSession,
  getSessionUserId,
  deleteSession,
};
