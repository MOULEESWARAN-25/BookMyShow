const express = require("express");
const requireRole = require("../middleware/requireRole");
const idempotency = require("../middleware/idempotency");
const { createBooking, listMyBookings, downloadTicket } = require("../controllers/booking");

const router = express.Router();

const requireCustomer = requireRole("user");

router.post("/", requireCustomer, idempotency("booking"), createBooking);
router.get("/mine", requireCustomer, listMyBookings);
router.get("/:bookingId/ticket", requireCustomer, downloadTicket);

module.exports = router;
