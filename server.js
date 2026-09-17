const express = require("express");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const pool = require("./db/pool");
const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/booking");
const movieRoutes = require("./routes/movie");
const showRoutes = require("./routes/show");
const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/shows", showRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const initDb = async () => {
  const initSql = fs.readFileSync(
    path.join(__dirname, "db", "init.sql"),
    "utf8",
  );
  await pool.query(initSql);
};

initDb()
  .then(() => {
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error.message);
    process.exit(1);
  });
