const express = require("express");
const { getSeats } = require("../controllers/movie");

const router = express.Router();

router.get("/:showId/seats", getSeats);

module.exports = router;
