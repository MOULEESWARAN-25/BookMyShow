const express = require("express");
require("dotenv").config();
const authMiddleware = require("../middleware/auth");
const { createBooking } = require("../controllers/booking");

const router = express.Router();

router.post("/", authMiddleware, createBooking);

module.exports = router;
