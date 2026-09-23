const express = require("express");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");
const {
  getSummary,
  rankMovies,
  rankTheatres,
  getDaily,
  getShowTimes,
  getGenres,
} = require("../controllers/analytics");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/summary", getSummary);
router.get("/movies", rankMovies);
router.get("/theatres", rankTheatres);
router.get("/daily", getDaily);
router.get("/show-times", getShowTimes);
router.get("/genres", getGenres);

module.exports = router;
