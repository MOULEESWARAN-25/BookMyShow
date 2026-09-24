const redis = require("../db/redis");

const rateLimit =
  ({ name, max, windowSeconds, message }) =>
  async (req, res, next) => {
    const key = `rate:${name}:${req.ip}`;
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

module.exports = rateLimit;
