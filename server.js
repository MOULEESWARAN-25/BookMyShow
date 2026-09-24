const express = require("express");

require("dotenv").config();

const { sequelize } = require("./models");
const redis = require("./db/redis");
const logger = require("./utils/logger");
const winstonLogger = require("./utils/winstonLogger");
const requestLogger = require("./middleware/requestLogger");
const { rateLimit, byUserOrIp } = require("./middleware/rateLimit");
const analyticsRoutes = require("./routes/analytics");
const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/booking");
const movieRoutes = require("./routes/movie");
const showRoutes = require("./routes/show");
const theatreRoutes = require("./routes/theatre");
const app = express();

app.use(requestLogger);
app.use(
  rateLimit({
    name: "api",
    max: 10,
    windowSeconds: 60,
    message: "Too many requests. Try again in a minute",
    identify: byUserOrIp,
  }),
);
app.use(express.json());

app.use("/api/analytics", analyticsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/theatres", theatreRoutes);

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body must be valid JSON" });
  }

  logger.error(err.stack || err.message);
  winstonLogger.error(err.stack || err.message);
  res.status(500).json({ message: "Internal server error" });
});

redis.on("error", (error) => {
  logger.error("Redis error:", error.message);
  winstonLogger.error(`Redis error: ${error.message}`);
});

const initDb = async () => {
  await Promise.all([sequelize.authenticate(), redis.connect()]);
};

initDb()
  .then(() => {
    app.listen(3000, () => {
      logger.info("Server is running on port 3000");
      winstonLogger.info("Server is running on port 3000");
    });
  })
  .catch((error) => {
    logger.error("Failed to initialize database:", error.message);
    winstonLogger.error(`Failed to initialize database: ${error.message}`);
    process.exit(1);
  });
