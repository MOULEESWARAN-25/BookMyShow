const { Op } = require("sequelize");
const { sequelize, Show, ShowSeat, Booking, BookingSeat } = require("../models");
const { parseId } = require("../utils/validation");

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
      if (show.startsAt <= new Date()) {
        throw new BookingError(400, "This show has already started");
      }

      const seatRows = await ShowSeat.findAll({
        where: { showId: numericShowId, seatNumber: { [Op.in]: requestedSeats } },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const seatsByNumber = new Map(seatRows.map((seat) => [seat.seatNumber, seat]));
      const missingSeat = requestedSeats.find((seat) => !seatsByNumber.has(seat));
      if (missingSeat) {
        throw new BookingError(400, `Seat ${missingSeat} does not exist`);
      }
      const bookedSeat = seatRows.find((seat) => seat.status === "booked");
      if (bookedSeat) {
        throw new BookingError(409, `Seat ${bookedSeat.seatNumber} is already booked`);
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
  } catch (error) {
    if (error instanceof BookingError) {
      return res.status(error.status).json({ message: error.message });
    }
    throw error;
  }
};

module.exports = {
  createBooking,
};
