const jwt = require("jsonwebtoken");
const redis = require("../db/redis");

// Runs inside Redis as one step, so two requests arriving together cannot both spend the last token.
// Tokens are refilled from the time passed since the last update; leftover time carries over.
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

// Runs before authMiddleware, so it reads the JWT itself; an invalid token falls back to the IP.
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
    const [allowed, , retryAfterMs] = await redis.eval(TAKE_TOKEN_SCRIPT, {
      keys: [`bucket:${name}:${identify(req)}`],
      arguments: [
        String(capacity),
        String(refillSeconds * 1000),
        String(Date.now()),
      ],
    });

    if (!allowed) {
      res.set("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
      return res.status(429).json({ message });
    }

    next();
  };

module.exports = { rateLimit, byUserOrIp };
