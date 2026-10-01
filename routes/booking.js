const express = require("express");
const authMiddleware = require("../middleware/auth");
const blockAdmin = require("../middleware/blockAdmin");
const idempotency = require("../middleware/idempotency");
const { createBooking } = require("../controllers/booking");

const router = express.Router();

router.post("/", authMiddleware, blockAdmin, idempotency("booking"), createBooking);

module.exports = router;
