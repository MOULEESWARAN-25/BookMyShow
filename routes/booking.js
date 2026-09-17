const express = require("express");
const authMiddleware = require("../middleware/auth");
const blockAdmin = require("../middleware/blockAdmin");
const { createBooking } = require("../controllers/booking");

const router = express.Router();

router.post("/", authMiddleware, blockAdmin, createBooking);

module.exports = router;
