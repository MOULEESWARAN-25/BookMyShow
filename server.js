const express = require("express");

require("dotenv").config();

const { sequelize } = require("./models");
const redis = require("./db/redis");
const { logger } = require("./utils/logger");
const requestLogger = require("./middleware/requestLogger");
const basicAuth = require("./middleware/basicAuth");
const { rateLimit, byUserOrIp } = require("./middleware/rateLimit");
const analyticsRoutes = require("./routes/analytics");
const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/booking");
const movieRoutes = require("./routes/movie");
const showRoutes = require("./routes/show");
const theatreRoutes = require("./routes/theatre");
const trackingRoutes = require("./routes/tracking");
const queueDashboard = require("./queues/dashboard");
const app = express();

app.use(requestLogger);
app.use("/api/tracking", trackingRoutes);
const { QUEUE_DASHBOARD_USER, QUEUE_DASHBOARD_PASSWORD } = process.env;
if (QUEUE_DASHBOARD_USER && QUEUE_DASHBOARD_PASSWORD) {
  app.use(
    queueDashboard.BASE_PATH,
    basicAuth({
      username: QUEUE_DASHBOARD_USER,
      password: QUEUE_DASHBOARD_PASSWORD,
      realm: "Queue dashboard",
    }),
    queueDashboard.router,
  );
}
app.use(
  rateLimit({
    name: "api",
    capacity: 10,
    refillSeconds: 6,
    message: "Too many requests. Try again in a few seconds",
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
  res.status(500).json({ message: "Internal server error" });
});

const initDb = async () => {
  await Promise.all([sequelize.authenticate(), redis.connect()]);
};

initDb()
  .then(() => {
    app.listen(3000, () => {
      logger.info("Server is running on port 3000");
    });
  })
  .catch((error) => {
    logger.error(`Failed to initialize database: ${error.message}`);
    process.exit(1);
  });
