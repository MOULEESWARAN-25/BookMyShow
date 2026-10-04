const { logger } = require("../utils/logger");

const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;
    const userId = req.user?.userId ?? "Anonymous";
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms user=${userId} ip=${req.ip}`;

    if (res.statusCode >= 500) {
      logger.error(message);
    } else if (res.statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  });

  next();
};

module.exports = requestLogger;
