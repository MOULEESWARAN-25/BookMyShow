const express = require("express");
const requireRole = require("../middleware/requireRole");
const {
  getSummary,
  getSiteSummary,
  rankMovies,
  rankTheatres,
  rankOwners,
  rankCities,
  getDaily,
  getShowTimes,
  getGenres,
} = require("../controllers/analytics");

const router = express.Router();

const theatreOwner = requireRole("admin");
const siteOwner = requireRole("super_admin");
const either = requireRole("admin", "super_admin");

// Theatre owners only ever see their own theatres; the site owner sees every theatre.
router.get("/summary", theatreOwner, getSummary);
router.get("/show-times", theatreOwner, getShowTimes);
router.get("/genres", theatreOwner, getGenres);

router.get("/site-summary", siteOwner, getSiteSummary);
router.get("/owners", siteOwner, rankOwners);
router.get("/cities", siteOwner, rankCities);

router.get("/movies", either, rankMovies);
router.get("/theatres", either, rankTheatres);
router.get("/daily", either, getDaily);

module.exports = router;
