const jwt = require("jsonwebtoken");
const redis = require("../db/redis");

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
  ({ name, max, windowSeconds, message, identify = byIp, blockSeconds }) =>
  async (req, res, next) => {
    const id = identify(req);
    const blockKey = `rate_block:${name}:${id}`;

    if (blockSeconds) {
      const blockedFor = await redis.ttl(blockKey);
      if (blockedFor > 0) {
        res.set("Retry-After", String(blockedFor));
        return res.status(429).json({ message });
      }
    }

    const key = `rate:${name}:${id}`;
    const [count, , ttl] = await redis
      .multi()
      .incr(key)
      .expire(key, windowSeconds, "NX")
      .ttl(key)
      .exec();

    if (count > max) {
      if (blockSeconds) {
        await redis.multi().set(blockKey, "1", { EX: blockSeconds }).del(key).exec();
      }
      res.set("Retry-After", String(blockSeconds || ttl));
      return res.status(429).json({ message });
    }

    next();
  };

module.exports = { rateLimit, byUserOrIp };
