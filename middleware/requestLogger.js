const logger = require("../utils/logger");
const winstonLogger = require("../utils/winstonLogger");

const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;
    const userId = req.user?.userId ?? "Anonymous";
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms user=${userId} ip=${req.ip}`;

    if (res.statusCode >= 500) {
      logger.error(message);
      winstonLogger.error(message);
    } else if (res.statusCode >= 400) {
      logger.warn(message);
      winstonLogger.warn(message);
    } else {
      logger.info(message);
      winstonLogger.info(message);
    }
  });

  next();
};

module.exports = requestLogger;
