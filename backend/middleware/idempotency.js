const crypto = require("crypto");
const redis = require("../db/redis");
const { redisLogger } = require("../utils/logger");

const TTL_SECONDS = 24 * 60 * 60;
const KEY_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;

const fingerprintOf = (body) =>
  crypto.createHash("sha256").update(JSON.stringify(body ?? {})).digest("hex");

const idempotency = (scope) => async (req, res, next) => {
  const key = req.get("Idempotency-Key");
  if (key === undefined) {
    return next();
  }
  if (!KEY_PATTERN.test(key)) {
    return res.status(400).json({
      message:
        "Idempotency-Key must be 1-100 characters: letters, numbers, - or _",
    });
  }

  const redisKey = `idempotency:${scope}:${req.user.userId}:${key}`;
  const fingerprint = fingerprintOf(req.body);

  const reserved = await redis.set(
    redisKey,
    JSON.stringify({ state: "processing", fingerprint }),
    { NX: true, EX: TTL_SECONDS },
  );

  if (reserved === null) {
    const saved = JSON.parse((await redis.get(redisKey)) ?? "null");
    if (!saved) {
      return res
        .status(409)
        .json({ message: "Please retry the request with the same Idempotency-Key" });
    }
    if (saved.fingerprint !== fingerprint) {
      return res.status(422).json({
        message: "This Idempotency-Key was already used with a different request body",
      });
    }
    if (saved.state === "processing") {
      return res.status(409).json({
        message: "A request with this Idempotency-Key is still being processed",
      });
    }
    redisLogger.info(`Idempotent replay of ${redisKey}`);
    res.set("Idempotent-Replayed", "true");
    return res.status(saved.status).json(saved.body);
  }

  const sendJson = res.json.bind(res);
  res.json = (body) => {
    const finish =
      res.statusCode >= 200 && res.statusCode < 300
        ? redis.set(
            redisKey,
            JSON.stringify({ state: "done", fingerprint, status: res.statusCode, body }),
            { EX: TTL_SECONDS },
          )
        : redis.del(redisKey);
    finish.catch((error) =>
      redisLogger.error(`Could not update ${redisKey}: ${error.message}`),
    );
    return sendJson(body);
  };

  next();
};

module.exports = idempotency;
