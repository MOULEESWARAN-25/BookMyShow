const express = require("express");
const requireAdmin = require("../middleware/admin");
const {
  createTheatre,
  listMyTheatres,
  updateTheatre,
  deleteTheatre,
} = require("../controllers/theatre");
const { listTheatreShows } = require("../controllers/show");

const router = express.Router();

router.post("/", requireAdmin, createTheatre);
router.get("/mine", requireAdmin, listMyTheatres);
router.get("/:theatreId/shows", requireAdmin, listTheatreShows);
router.patch("/:theatreId", requireAdmin, updateTheatre);
router.delete("/:theatreId", requireAdmin, deleteTheatre);

module.exports = router;
