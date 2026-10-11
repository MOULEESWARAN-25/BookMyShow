const jwt = require("jsonwebtoken");
const redis = require("../db/redis");
const { redisLogger } = require("../utils/logger");

const TAKE_TOKEN_SCRIPT = `
local capacity = tonumber(ARGV[1])
local refillMs = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local bucket = redis.call("HMGET", KEYS[1], "tokens", "updatedAt")
local tokens = tonumber(bucket[1])
local updatedAt = tonumber(bucket[2])
if tokens == nil then
  tokens = capacity
  updatedAt = now
end

local refilled = math.floor((now - updatedAt) / refillMs)
if refilled > 0 then
  tokens = math.min(capacity, tokens + refilled)
  updatedAt = updatedAt + refilled * refillMs
end
if tokens == capacity then
  updatedAt = now
end

local allowed = 0
local retryAfterMs = 0
if tokens > 0 then
  tokens = tokens - 1
  allowed = 1
else
  retryAfterMs = refillMs - (now - updatedAt)
end

redis.call("HSET", KEYS[1], "tokens", tokens, "updatedAt", updatedAt)
redis.call("PEXPIRE", KEYS[1], capacity * refillMs)
return { allowed, tokens, retryAfterMs }
`;

const byIp = (req) => `ip:${req.ip}`;

const byUserOrIp = (req) => {
  const token = req.get("Authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (token) {
    try {
      const { userId } = jwt.verify(token, process.env.JWT_SECRET);
      if (Number.isInteger(userId)) {
        return `user:${userId}`;
      }
    } catch {}
  }
  return byIp(req);
};

const rateLimit =
  ({ name, capacity, refillSeconds, message, identify = byIp }) =>
  async (req, res, next) => {
    const key = `bucket:${name}:${identify(req)}`;
    const [allowed, , retryAfterMs] = await redis.eval(TAKE_TOKEN_SCRIPT, {
      keys: [key],
      arguments: [
        String(capacity),
        String(refillSeconds * 1000),
        String(Date.now()),
      ],
    });

    if (!allowed) {
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
      redisLogger.warn(
        `Rate limit hit ${key} on ${req.method} ${req.originalUrl}, next token in ${retryAfterSeconds}s`,
      );
      res.set("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({ message });
    }

    next();
  };

module.exports = { rateLimit, byUserOrIp };
