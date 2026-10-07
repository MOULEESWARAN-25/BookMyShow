const redis = require("../db/redis");
const { redisLogger } = require("./logger");

// Two limits: a session ends after 30 minutes without any request (idle), and in any case
// 12 hours after login (max), so a stolen token cannot be kept alive forever by using it.
const SESSION_IDLE_SECONDS = 30 * 60;
const SESSION_MAX_SECONDS = 12 * 60 * 60;
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
  transaction.set(sessionKey(token), String(userId), {
    EX: SESSION_IDLE_SECONDS,
  });
  transaction.zAdd(userKey, {
    score: now + SESSION_IDLE_SECONDS * 1000,
    value: token,
  });
  transaction.expire(userKey, SESSION_IDLE_SECONDS);
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

// Called on every logged-in request: the user is active, so the 30 idle minutes start again.
// XX only updates a session that is still listed, so a request racing a logout cannot bring it back.
const touchSession = async (userId, token) => {
  const userKey = userSessionsKey(userId);
  await redis
    .multi()
    .expire(sessionKey(token), SESSION_IDLE_SECONDS)
    .zAdd(userKey, { score: Date.now() + SESSION_IDLE_SECONDS * 1000, value: token }, { XX: true })
    .expire(userKey, SESSION_IDLE_SECONDS)
    .exec();
};

const deleteSession = async (userId, token) => {
  await redis
    .multi()
    .del(sessionKey(token))
    .zRem(userSessionsKey(userId), token)
    .exec();
  redisLogger.info(`Session deleted for user ${userId} (logout)`);
};

const deleteAllSessions = async (userId) => {
  const tokens = await redis.zRange(userSessionsKey(userId), 0, -1);
  const transaction = redis.multi().del(userSessionsKey(userId));
  if (tokens.length > 0) {
    transaction.del(tokens.map(sessionKey));
  }
  await transaction.exec();
  redisLogger.info(`All sessions deleted for user ${userId}`);
};

module.exports = {
  SESSION_IDLE_SECONDS,
  SESSION_MAX_SECONDS,
  createSession,
  getSessionUserId,
  touchSession,
  deleteSession,
  deleteAllSessions,
};
