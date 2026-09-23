const express = require("express");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");
const {
  listMovies,
  getMovie,
  listShows,
  createMovie,
} = require("../controllers/movie");

const router = express.Router();

router.get("/", listMovies);
router.get("/:movieId", getMovie);
router.get("/:movieId/shows", listShows);
router.post("/", authMiddleware, adminMiddleware, createMovie);

module.exports = router;
