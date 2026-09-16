const express = require("express");
const cors = require("cors");

require("dotenv").config();

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

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
