const express = require("express");
const requireAdmin = require("../middleware/admin");
const {
  listMovies,
  getMovie,
  listShows,
  createMovie,
  updateMovie,
  deleteMovie,
} = require("../controllers/movie");

const router = express.Router();

router.get("/", listMovies);
router.get("/:movieId", getMovie);
router.get("/:movieId/shows", listShows);
router.post("/", requireAdmin, createMovie);
router.patch("/:movieId", requireAdmin, updateMovie);
router.delete("/:movieId", requireAdmin, deleteMovie);

module.exports = router;
