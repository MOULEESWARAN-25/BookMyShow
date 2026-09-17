const express = require("express");
const optionalAuth = require("../middleware/optionalAuth");
const blockAdmin = require("../middleware/blockAdmin");
const { getSeats } = require("../controllers/movie");

const router = express.Router();

router.get("/:showId/seats", optionalAuth, blockAdmin, getSeats);

module.exports = router;
