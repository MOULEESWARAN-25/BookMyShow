const express = require("express");
const authMiddleware = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");
const adminMiddleware = require("../middleware/admin");
const blockAdmin = require("../middleware/blockAdmin");
const {
  listMovies,
  getMovie,
  listShows,
  createMovie,
} = require("../controllers/movie");

const router = express.Router();

router.get("/", optionalAuth, blockAdmin, listMovies);
router.get("/:movieId", optionalAuth, blockAdmin, getMovie);
router.get("/:movieId/shows", optionalAuth, blockAdmin, listShows);
router.post("/", authMiddleware, adminMiddleware, createMovie);

module.exports = router;
