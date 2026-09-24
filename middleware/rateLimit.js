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
  ({ name, max, windowSeconds, message, identify = byIp }) =>
  async (req, res, next) => {
    const key = `rate:${name}:${identify(req)}`;
    const [count, , ttl] = await redis
      .multi()
      .incr(key)
      .expire(key, windowSeconds, "NX")
      .ttl(key)
      .exec();

    if (count > max) {
      res.set("Retry-After", String(ttl));
      return res.status(429).json({ message });
    }

    next();
  };

module.exports = { rateLimit, byUserOrIp };
