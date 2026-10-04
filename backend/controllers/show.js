const { ExclusionConstraintError, ForeignKeyConstraintError } = require("sequelize");
const { sequelize, Movie, Show, ShowSeat, Theatre, Booking } = require("../models");
const { parseId } = require("../utils/validation");
const { showsCacheKey, clearCache } = require("../utils/cache");
const {
  addShowUpdatedEmailJobs,
  addShowCancelledEmailJobs,
} = require("../queues/ticketEmail");
const { logger } = require("../utils/logger");

const MAX_SEATS_PER_ROW = 50;

const parseDate = (value) => {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseSeatLayout = (seatRows, seatsPerRow) => {
  const rows = Array.isArray(seatRows)
    ? seatRows.map((row) => (typeof row === "string" ? row.trim().toUpperCase() : ""))
    : [];
  if (
    rows.length === 0 ||
    rows.some((row) => !/^[A-Z]+$/.test(row)) ||
    new Set(rows).size !== rows.length
  ) {
    return { error: "seatRows must be a non-empty array of unique letters" };
  }
  if (
    !Number.isInteger(seatsPerRow) ||
    seatsPerRow <= 0 ||
    seatsPerRow > MAX_SEATS_PER_ROW
  ) {
    return {
      error: `seatsPerRow must be an integer between 1 and ${MAX_SEATS_PER_ROW}`,
    };
  }
  return { rows };
};

const seatsFor = (showId, rows, seatsPerRow) =>
  rows.flatMap((row) =>
    Array.from({ length: seatsPerRow }, (_, index) => ({
      showId,
      seatNumber: `${row}${index + 1}`,
    })),
  );

const findOwnShow = async (req, res) => {
  const showId = parseId(req.params.showId);
  if (!showId) {
    res.status(400).json({ message: "showId must be a positive integer" });
    return null;
  }
  const show = await Show.findByPk(showId, {
    include: [{ model: Theatre, as: "theatre", attributes: ["id", "adminId"] }],
  });
  if (!show) {
    res.status(404).json({ message: "Show not found" });
    return null;
  }
  if (show.theatre.adminId !== req.user.userId) {
    res.status(403).json({ message: "You can only manage shows in your own theatres" });
    return null;
  }
  if (show.cancelledAt) {
    res.status(409).json({ message: "This show was cancelled" });
    return null;
  }
  if (show.startsAt <= new Date()) {
    res.status(409).json({ message: "This show has already started" });
    return null;
  }
  return show;
};

const queueEmails = (addJobs, label) =>
  addJobs().catch((error) =>
    logger.error(`Could not queue ${label} emails: ${error.message}`),
  );

const getSeats = async (req, res) => {
  const showId = parseId(req.params.showId);
  if (!showId) {
    return res
      .status(400)
      .json({ message: "showId must be a positive integer" });
  }

  const show = await Show.findByPk(showId, { attributes: ["id", "cancelledAt"] });
  if (!show) {
    return res.status(404).json({ message: "Show not found" });
  }
  if (show.cancelledAt) {
    return res.status(404).json({ message: "This show was cancelled" });
  }

  const seats = await ShowSeat.findAll({
    where: { showId },
    attributes: ["seatNumber", "status"],
    order: [["id", "ASC"]],
  });
  res.status(200).json({ showId, seats });
};

const createShow = async (req, res) => {
  const { movieId, theatreId, startsAt, endsAt, price, seatRows, seatsPerRow } =
    req.body || {};

  const numericMovieId = parseId(movieId);
  const numericTheatreId = parseId(theatreId);
  if (!numericMovieId || !numericTheatreId) {
    return res
      .status(400)
      .json({ message: "movieId and theatreId must be positive integers" });
  }

  const start = parseDate(startsAt);
  const end = parseDate(endsAt);
  if (!start || !end) {
    return res
      .status(400)
      .json({ message: "startsAt and endsAt must be valid ISO date-times" });
  }
  if (end <= start) {
    return res.status(400).json({ message: "endsAt must be after startsAt" });
  }
  if (start <= new Date()) {
    return res.status(400).json({ message: "startsAt must be in the future" });
  }

  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
    return res
      .status(400)
      .json({ message: "price must be a non-negative number" });
  }

  const layout = parseSeatLayout(seatRows, seatsPerRow);
  if (layout.error) {
    return res.status(400).json({ message: layout.error });
  }
  const { rows } = layout;

  const theatre = await Theatre.findByPk(numericTheatreId, {
    attributes: ["id", "adminId"],
  });
  if (!theatre) {
    return res.status(404).json({ message: "Theatre not found" });
  }
  if (theatre.adminId !== req.user.userId) {
    return res
      .status(403)
      .json({ message: "You can only add shows to your own theatres" });
  }

  const movie = await Movie.findByPk(numericMovieId, { attributes: ["id"] });
  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  try {
    const show = await sequelize.transaction(async (transaction) => {
      const createdShow = await Show.create(
        {
          movieId: numericMovieId,
          theatreId: numericTheatreId,
          startsAt: start,
          endsAt: end,
          price,
        },
        { transaction },
      );

      await ShowSeat.bulkCreate(seatsFor(createdShow.id, rows, seatsPerRow), {
        transaction,
      });

      return createdShow;
    });
    await clearCache(showsCacheKey(numericMovieId));

    res.status(201).json({
      message: "Show created successfully",
      show: {
        id: show.id,
        movieId: show.movieId,
        theatreId: show.theatreId,
        startsAt: show.startsAt,
        endsAt: show.endsAt,
        price: show.price,
        totalSeats: rows.length * seatsPerRow,
      },
    });
  } catch (error) {
    if (error instanceof ExclusionConstraintError) {
      return res.status(409).json({
        message: "This theatre already has a show during that time",
      });
    }
    throw error;
  }
};

const listTheatreShows = async (req, res) => {
  const theatreId = parseId(req.params.theatreId);
  if (!theatreId) {
    return res.status(400).json({ message: "theatreId must be a positive integer" });
  }
  const theatre = await Theatre.findByPk(theatreId, { attributes: ["id", "adminId"] });
  if (!theatre) {
    return res.status(404).json({ message: "Theatre not found" });
  }
  if (theatre.adminId !== req.user.userId) {
    return res.status(403).json({ message: "You can only view your own theatres" });
  }

  const shows = await sequelize.query(
    `SELECT s.id, s.movie_id AS "movieId", m.title AS "movieTitle",
            s.starts_at AS "startsAt", s.ends_at AS "endsAt", s.price::float8 AS price,
            s.cancelled_at AS "cancelledAt",
            count(ss.id)::int AS "totalSeats",
            count(ss.id) FILTER (WHERE ss.status = 'booked')::int AS "bookedSeats"
       FROM shows s
       JOIN movies m ON m.id = s.movie_id
       LEFT JOIN show_seats ss ON ss.show_id = s.id
      WHERE s.theatre_id = :theatreId
      GROUP BY s.id, m.title
      ORDER BY s.starts_at DESC`,
    { replacements: { theatreId }, type: "SELECT" },
  );
  res.status(200).json({ shows });
};

const updateShow = async (req, res) => {
  const { startsAt, endsAt, price } = req.body || {};
  if (startsAt === undefined && endsAt === undefined && price === undefined) {
    return res
      .status(400)
      .json({ message: "Send at least one of startsAt, endsAt, price" });
  }

  const show = await findOwnShow(req, res);
  if (!show) return;

  const start = startsAt === undefined ? show.startsAt : parseDate(startsAt);
  const end = endsAt === undefined ? show.endsAt : parseDate(endsAt);
  if (!start || !end) {
    return res
      .status(400)
      .json({ message: "startsAt and endsAt must be valid ISO date-times" });
  }
  if (end <= start) {
    return res.status(400).json({ message: "endsAt must be after startsAt" });
  }
  if (start <= new Date()) {
    return res.status(400).json({ message: "startsAt must be in the future" });
  }
  if (
    price !== undefined &&
    (typeof price !== "number" || !Number.isFinite(price) || price < 0)
  ) {
    return res.status(400).json({ message: "price must be a non-negative number" });
  }

  const timeChanged =
    start.getTime() !== show.startsAt.getTime() || end.getTime() !== show.endsAt.getTime();

  let bookingIds = [];
  try {
    await sequelize.transaction(async (transaction) => {
      await show.update(
        {
          startsAt: start,
          endsAt: end,
          ...(price !== undefined && { price }),
          ...(timeChanged && { reminderQueuedAt: null }),
        },
        { transaction },
      );
      if (timeChanged) {
        const bookings = await Booking.findAll({
          where: { showId: show.id, status: "confirmed" },
          attributes: ["id"],
          transaction,
        });
        bookingIds = bookings.map((booking) => booking.id);
        if (bookingIds.length > 0) {
          await Booking.update(
            { reminderSentAt: null },
            { where: { id: bookingIds }, transaction },
          );
        }
      }
    });
  } catch (error) {
    if (error instanceof ExclusionConstraintError) {
      return res
        .status(409)
        .json({ message: "This theatre already has a show during that time" });
    }
    throw error;
  }

  await clearCache(showsCacheKey(show.movieId));
  if (bookingIds.length > 0) {
    await queueEmails(() => addShowUpdatedEmailJobs(bookingIds, start), "time-change");
  }

  res.status(200).json({
    message: "Show updated successfully",
    show: {
      id: show.id,
      startsAt: show.startsAt,
      endsAt: show.endsAt,
      price: show.price,
    },
    customersNotified: bookingIds.length,
  });
};

const deleteShow = async (req, res) => {
  const show = await findOwnShow(req, res);
  if (!show) return;

  const result = await sequelize.transaction(async (transaction) => {
    const bookings = await Booking.findAll({
      where: { showId: show.id },
      attributes: ["id", "status"],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (bookings.length === 0) {
      await show.destroy({ transaction });
      return { deleted: true, bookingIds: [] };
    }

    const bookingIds = bookings
      .filter((booking) => booking.status === "confirmed")
      .map((booking) => booking.id);
    await show.update({ cancelledAt: new Date() }, { transaction });
    if (bookingIds.length > 0) {
      await Booking.update(
        { status: "cancelled" },
        { where: { id: bookingIds }, transaction },
      );
      await ShowSeat.update(
        { status: "available" },
        { where: { showId: show.id }, transaction },
      );
    }
    return { deleted: false, bookingIds };
  });

  await clearCache(showsCacheKey(show.movieId));
  if (result.bookingIds.length > 0) {
    await queueEmails(() => addShowCancelledEmailJobs(result.bookingIds), "cancellation");
  }

  res.status(200).json(
    result.deleted
      ? { message: "Show deleted" }
      : {
          message: "Show cancelled: it had bookings, so it is kept for history",
          bookingsCancelled: result.bookingIds.length,
        },
  );
};

const addSeats = async (req, res) => {
  const { seatRows, seatsPerRow } = req.body || {};
  const layout = parseSeatLayout(seatRows, seatsPerRow);
  if (layout.error) {
    return res.status(400).json({ message: layout.error });
  }

  const show = await findOwnShow(req, res);
  if (!show) return;

  const seats = seatsFor(show.id, layout.rows, seatsPerRow);
  const existing = await ShowSeat.count({
    where: { showId: show.id, seatNumber: seats.map((seat) => seat.seatNumber) },
  });
  await ShowSeat.bulkCreate(seats, { ignoreDuplicates: true });

  res.status(201).json({
    message: "Seats added",
    added: seats.length - existing,
    alreadyExisted: existing,
  });
};

const deleteSeat = async (req, res) => {
  const seatNumber = String(req.params.seatNumber || "").trim().toUpperCase();
  const show = await findOwnShow(req, res);
  if (!show) return;

  const seat = await ShowSeat.findOne({ where: { showId: show.id, seatNumber } });
  if (!seat) {
    return res.status(404).json({ message: `Seat ${seatNumber} does not exist` });
  }
  if (seat.status === "booked") {
    return res
      .status(409)
      .json({ message: `Seat ${seatNumber} is booked and cannot be removed` });
  }

  try {
    await seat.destroy();
  } catch (error) {
    if (error instanceof ForeignKeyConstraintError) {
      return res.status(409).json({
        message: `Seat ${seatNumber} is part of a past booking and cannot be removed`,
      });
    }
    throw error;
  }
  res.status(200).json({ message: `Seat ${seatNumber} removed` });
};

module.exports = {
  getSeats,
  createShow,
  listTheatreShows,
  updateShow,
  deleteShow,
  addSeats,
  deleteSeat,
};
