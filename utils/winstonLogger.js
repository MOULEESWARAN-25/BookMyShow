const winston = require("winston");
const path = require("path");

const LOG_DIR = path.join(__dirname, "..", "logs");

const winstonLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) =>
        `[${timestamp}] [${level.toUpperCase()}] ${message}`,
    ),
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(LOG_DIR, "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, "combined.log"),
    }),
  ],
});

module.exports = winstonLogger;
