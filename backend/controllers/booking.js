const { Op } = require("sequelize");
const {
  sequelize,
  Show,
  ShowSeat,
  Booking,
  BookingSeat,
} = require("../models");
const { parseId } = require("../utils/validation");
const { addTicketEmailJob } = require("../queues/ticketEmail");
const { loadTicket } = require("../utils/ticketEmail");
const { buildTicketPdf } = require("../utils/ticketPdf");
const { logger } = require("../utils/logger");

const MAX_SEATS_PER_BOOKING = 10;

class BookingError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const createBooking = async (req, res) => {
  const { showId, seats } = req.body || {};
  const numericShowId = parseId(showId);

  if (
    !numericShowId ||
    !Array.isArray(seats) ||
    seats.length === 0 ||
    seats.some((seat) => typeof seat !== "string" || !seat.trim())
  ) {
    return res
      .status(400)
      .json({ message: "showId and a non-empty seats array are required" });
  }

  if (seats.length > MAX_SEATS_PER_BOOKING) {
    return res
      .status(400)
      .json({ message: `You can book at most ${MAX_SEATS_PER_BOOKING} seats at a time` });
  }

  const requestedSeats = seats.map((seat) => seat.trim().toUpperCase());
  if (new Set(requestedSeats).size !== requestedSeats.length) {
    return res.status(400).json({ message: "Duplicate seats are not allowed" });
  }

  try {
    const booking = await sequelize.transaction(async (transaction) => {
      const show = await Show.findByPk(numericShowId, { transaction });
      if (!show) {
        throw new BookingError(404, "Show not found");
      }
      if (show.cancelledAt) {
        throw new BookingError(400, "This show was cancelled");
      }
      if (show.startsAt <= new Date()) {
        throw new BookingError(400, "This show has already started");
      }

      const seatRows = await ShowSeat.findAll({
        where: {
          showId: numericShowId,
          seatNumber: { [Op.in]: requestedSeats },
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const seatsByNumber = new Map(
        seatRows.map((seat) => [seat.seatNumber, seat]),
      );
      const missingSeat = requestedSeats.find(
        (seat) => !seatsByNumber.has(seat),
      );
      if (missingSeat) {
        throw new BookingError(400, `Seat ${missingSeat} does not exist`);
      }
      const bookedSeat = seatRows.find((seat) => seat.status === "booked");
      if (bookedSeat) {
        throw new BookingError(
          409,
          `Seat ${bookedSeat.seatNumber} is already booked`,
        );
      }

      await ShowSeat.update(
        { status: "booked" },
        { where: { id: seatRows.map((seat) => seat.id) }, transaction },
      );

      const createdBooking = await Booking.create(
        {
          userId: req.user.userId,
          showId: numericShowId,
          totalAmount: (show.price * requestedSeats.length).toFixed(2),
        },
        { transaction },
      );

      await BookingSeat.bulkCreate(
        seatRows.map((seat) => ({
          bookingId: createdBooking.id,
          showSeatId: seat.id,
        })),
        { transaction },
      );

      return createdBooking;
    });

    res.status(201).json({
      message: "Booking created successfully",
      booking: {
        id: booking.id,
        showId: booking.showId,
        seats: requestedSeats,
        totalAmount: booking.totalAmount,
        status: booking.status,
        createdAt: booking.createdAt,
      },
    });

    addTicketEmailJob(booking.id).catch((error) => {
      logger.error(
        `Could not queue ticket email for booking ${booking.id}: ${error.message}`,
      );
    });
  } catch (error) {
    if (error instanceof BookingError) {
      return res.status(error.status).json({ message: error.message });
    }
    throw error;
  }
};

const listMyBookings = async (req, res) => {
  const bookings = await sequelize.query(
    `SELECT b.id, b.status, b.total_amount::float8 AS "totalAmount", b.created_at AS "createdAt",
            s.id AS "showId", s.starts_at AS "startsAt", s.cancelled_at AS "showCancelledAt",
            m.id AS "movieId", m.title AS "movieTitle",
            t.name AS "theatreName", t.city AS "theatreCity",
            array_agg(ss.seat_number ORDER BY ss.id) AS seats
       FROM bookings b
       JOIN shows s ON s.id = b.show_id
       JOIN movies m ON m.id = s.movie_id
       JOIN theatres t ON t.id = s.theatre_id
       JOIN booking_seats bs ON bs.booking_id = b.id
       JOIN show_seats ss ON ss.id = bs.show_seat_id
      WHERE b.user_id = :userId
      GROUP BY b.id, s.id, m.id, t.id
      ORDER BY s.starts_at DESC`,
    { replacements: { userId: req.user.userId }, type: "SELECT" },
  );

  res.status(200).json({ bookings });
};

const downloadTicket = async (req, res) => {
  const bookingId = parseId(req.params.bookingId);
  if (!bookingId) {
    return res.status(400).json({ message: "bookingId must be a positive integer" });
  }

  const booking = await Booking.findByPk(bookingId, { attributes: ["id", "userId", "status"] });
  // Someone else's booking gets the same answer as a missing one, so ids cannot be probed.
  if (!booking || booking.userId !== req.user.userId) {
    return res.status(404).json({ message: "Booking not found" });
  }
  if (booking.status === "cancelled") {
    return res.status(409).json({ message: "This booking was cancelled, so it has no ticket" });
  }

  const ticket = await loadTicket(booking.id);
  const pdf = await buildTicketPdf(ticket);
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="ticket-${ticket.code}.pdf"`,
  });
  res.send(pdf);
};

module.exports = {
  createBooking,
  listMyBookings,
  downloadTicket,
};
