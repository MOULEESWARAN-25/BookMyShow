const express = require("express");
const requireAdmin = require("../middleware/admin");
const {
  getSummary,
  rankMovies,
  rankTheatres,
  getDaily,
  getShowTimes,
  getGenres,
} = require("../controllers/analytics");

const router = express.Router();

router.use(requireAdmin);

router.get("/summary", getSummary);
router.get("/movies", rankMovies);
router.get("/theatres", rankTheatres);
router.get("/daily", getDaily);
router.get("/show-times", getShowTimes);
router.get("/genres", getGenres);

module.exports = router;
