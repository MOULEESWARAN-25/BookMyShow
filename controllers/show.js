const { ExclusionConstraintError } = require("sequelize");
const { sequelize, Movie, Show, ShowSeat, Theatre } = require("../models");
const { parseId } = require("../utils/validation");
const { showsCacheKey, clearCache } = require("../utils/cache");

const MAX_SEATS_PER_ROW = 50;

const parseDate = (value) => {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getSeats = async (req, res) => {
  const showId = parseId(req.params.showId);
  if (!showId) {
    return res
      .status(400)
      .json({ message: "showId must be a positive integer" });
  }

  const show = await Show.findByPk(showId, { attributes: ["id"] });
  if (!show) {
    return res.status(404).json({ message: "Show not found" });
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

  const rows = Array.isArray(seatRows)
    ? seatRows.map((row) => (typeof row === "string" ? row.trim().toUpperCase() : ""))
    : [];
  if (
    rows.length === 0 ||
    rows.some((row) => !/^[A-Z]+$/.test(row)) ||
    new Set(rows).size !== rows.length
  ) {
    return res
      .status(400)
      .json({ message: "seatRows must be a non-empty array of unique letters" });
  }

  if (
    !Number.isInteger(seatsPerRow) ||
    seatsPerRow <= 0 ||
    seatsPerRow > MAX_SEATS_PER_ROW
  ) {
    return res.status(400).json({
      message: `seatsPerRow must be an integer between 1 and ${MAX_SEATS_PER_ROW}`,
    });
  }

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

      const seats = rows.flatMap((row) =>
        Array.from({ length: seatsPerRow }, (_, index) => ({
          showId: createdShow.id,
          seatNumber: `${row}${index + 1}`,
        })),
      );
      await ShowSeat.bulkCreate(seats, { transaction });

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

module.exports = {
  getSeats,
  createShow,
};
