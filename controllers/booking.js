const { Op } = require("sequelize");
const { sequelize, Show, Seat, Booking } = require("../models");

const createBooking = async (req, res) => {
  const { showId, seats } = req.body || {};
  const numericShowId = Number(showId);

  if (
    !Number.isInteger(numericShowId) ||
    numericShowId <= 0 ||
    !Array.isArray(seats) ||
    seats.length === 0 ||
    seats.some((seat) => typeof seat !== "string" || !seat.trim())
  ) {
    return res
      .status(400)
      .json({ message: "showId and a non-empty seats array are required" });
  }

  const requestedSeats = seats.map((seat) => seat.trim());
  const uniqueSeats = [...new Set(requestedSeats)];
  if (uniqueSeats.length !== requestedSeats.length) {
    return res.status(400).json({ message: "Duplicate seats are not allowed" });
  }

  try {
    const booking = await sequelize.transaction(async (transaction) => {
      const show = await Show.findByPk(numericShowId, { transaction });
      if (!show) {
        const notFound = new Error("Show not found");
        notFound.status = 404;
        throw notFound;
      }

      const seatRows = await Seat.findAll({
        where: { showId: numericShowId, seatNumber: { [Op.in]: uniqueSeats } },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const foundSeats = new Map(
        seatRows.map((seat) => [seat.seatNumber, seat.status]),
      );
      const unavailableSeat = uniqueSeats.find(
        (seatNumber) => !foundSeats.has(seatNumber),
      );
      if (unavailableSeat) {
        const badSeat = new Error(`Seat ${unavailableSeat} does not exist`);
        badSeat.status = 400;
        throw badSeat;
      }

      const bookedSeat = uniqueSeats.find(
        (seatNumber) => foundSeats.get(seatNumber) === "booked",
      );
      if (bookedSeat) {
        const conflict = new Error(`Seat ${bookedSeat} is already booked`);
        conflict.status = 409;
        throw conflict;
      }

      await Seat.update(
        { status: "booked" },
        {
          where: {
            showId: numericShowId,
            seatNumber: { [Op.in]: uniqueSeats },
          },
          transaction,
        },
      );

      return Booking.create(
        {
          userId: req.user.userId,
          showId: numericShowId,
          seats: uniqueSeats,
          status: "booked",
        },
        { transaction },
      );
    });

    res.status(201).json({
      message: "Booking created successfully",
      booking: {
        id: booking.id,
        userId: booking.userId,
        showId: booking.showId,
        seats: booking.seats,
        status: booking.status,
      },
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    throw error;
  }
};

module.exports = {
  createBooking,
};
