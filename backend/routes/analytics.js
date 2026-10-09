const express = require("express");
const requireRole = require("../middleware/requireRole");
const {
  getSummary,
  getSlowShows,
  getSiteSummary,
  rankMovies,
  rankTheatres,
  rankOwners,
  rankCities,
  getDaily,
  getShowTimes,
  getGenres,
  getReviews,
} = require("../controllers/analytics");

const router = express.Router();

const theatreOwner = requireRole("admin");
const siteOwner = requireRole("super_admin");
const either = requireRole("admin", "super_admin");

// Theatre owners only ever see their own theatres; the site owner sees every theatre.
router.get("/summary", theatreOwner, getSummary);
router.get("/slow-shows", theatreOwner, getSlowShows);
router.get("/theatres", theatreOwner, rankTheatres);
router.get("/show-times", theatreOwner, getShowTimes);
router.get("/reviews", theatreOwner, getReviews);

router.get("/site-summary", siteOwner, getSiteSummary);
router.get("/owners", siteOwner, rankOwners);
router.get("/cities", siteOwner, rankCities);

router.get("/movies", either, rankMovies);
router.get("/genres", either, getGenres);
router.get("/daily", either, getDaily);

module.exports = router;
