const winston = require("winston");
const path = require("path");

const LOG_DIR = path.join(__dirname, "..", "logs");

const createLogger = (mainFile, tag) =>
  winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(
        ({ timestamp, level, message }) =>
          `[${timestamp}] [${level.toUpperCase()}]${tag ? ` [${tag}]` : ""} ${message}`,
      ),
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(LOG_DIR, "error.log"),
        level: "error",
      }),
      new winston.transports.File({
        filename: path.join(LOG_DIR, mainFile),
      }),
    ],
  });

const logger = createLogger("combined.log");
const redisLogger = createLogger("redis.log", "REDIS");

module.exports = { logger, redisLogger };
