const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");

fs.mkdirSync(LOG_DIR, { recursive: true });

const formatMessage = (level, args) => {
  const timestamp = new Date().toISOString();
  const message = args
    .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
    .join(" ");
  return `[${timestamp}] [${level}] ${message}\n`;
};

const write = (level, args) => {
  fs.appendFile(LOG_FILE, formatMessage(level, args), (err) => {
    if (err) {
      process.stderr.write(`Failed to write log: ${err.message}\n`);
    }
  });
};

const info = (...args) => write("INFO", args);
const error = (...args) => write("ERROR", args);
const warn = (...args) => write("WARN", args);

module.exports = { info, error, warn };
