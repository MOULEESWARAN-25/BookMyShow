const express = require("express");
const requireAdmin = require("../middleware/admin");
const {
  getSeats,
  createShow,
  updateShow,
  deleteShow,
  addSeats,
  deleteSeat,
} = require("../controllers/show");

const router = express.Router();

router.get("/:showId/seats", getSeats);
router.post("/", requireAdmin, createShow);
router.patch("/:showId", requireAdmin, updateShow);
router.delete("/:showId", requireAdmin, deleteShow);
router.post("/:showId/seats", requireAdmin, addSeats);
router.delete("/:showId/seats/:seatNumber", requireAdmin, deleteSeat);

module.exports = router;
