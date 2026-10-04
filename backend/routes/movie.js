const express = require("express");
const requireAdmin = require("../middleware/admin");
const {
  listMovies,
  listAllMovies,
  listMyMovies,
  getMovie,
  listShows,
  createMovie,
  updateMovie,
  deleteMovie,
} = require("../controllers/movie");

const router = express.Router();

router.get("/", listMovies);
router.get("/all", requireAdmin, listAllMovies);
router.get("/mine", requireAdmin, listMyMovies);
router.get("/:movieId", getMovie);
router.get("/:movieId/shows", listShows);
router.post("/", requireAdmin, createMovie);
router.patch("/:movieId", requireAdmin, updateMovie);
router.delete("/:movieId", requireAdmin, deleteMovie);

module.exports = router;
