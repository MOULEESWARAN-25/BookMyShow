const express = require("express");
const authMiddleware = require("../middleware/auth");
const blockAdmin = require("../middleware/blockAdmin");
const idempotency = require("../middleware/idempotency");
const { createBooking, listMyBookings, downloadTicket } = require("../controllers/booking");

const router = express.Router();

router.post("/", authMiddleware, blockAdmin, idempotency("booking"), createBooking);
router.get("/mine", authMiddleware, blockAdmin, listMyBookings);
router.get("/:bookingId/ticket", authMiddleware, blockAdmin, downloadTicket);

module.exports = router;
