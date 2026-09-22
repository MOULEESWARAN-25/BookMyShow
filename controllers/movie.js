const { sequelize, Movie, Show, Seat } = require("../models");

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const listMovies = async (req, res) => {
  const movies = await Movie.findAll({
    attributes: ["id", "title", "language", "genre", "duration"],
    order: [["id", "ASC"]],
  });
  res.status(200).json({ movies });
};

const getMovie = async (req, res) => {
  const movieId = parseId(req.params.movieId);
  if (!movieId) {
    return res
      .status(400)
      .json({ message: "movieId must be a positive integer" });
  }

  const movie = await Movie.findByPk(movieId, {
    attributes: ["id", "title", "language", "genre", "duration"],
  });
  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  res.status(200).json({ movie });
};

const listShows = async (req, res) => {
  const movieId = parseId(req.params.movieId);
  if (!movieId) {
    return res
      .status(400)
      .json({ message: "movieId must be a positive integer" });
  }

  const movie = await Movie.findByPk(movieId);
  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  const shows = await Show.findAll({
    where: { movieId },
    attributes: ["id", "time"],
    order: [["id", "ASC"]],
  });
  res.status(200).json({ shows });
};

const getSeats = async (req, res) => {
  const showId = parseId(req.params.showId);
  if (!showId) {
    return res
      .status(400)
      .json({ message: "showId must be a positive integer" });
  }

  const show = await Show.findByPk(showId);
  if (!show) {
    return res.status(404).json({ message: "Show not found" });
  }

  const seats = await Seat.findAll({
    where: { showId },
    attributes: [["seat_number", "seatNumber"], "status"],
    order: [["seatNumber", "ASC"]],
  });
  res.status(200).json({ showId, seats });
};

const createMovie = async (req, res) => {
  const { title, language, genre, duration, shows } = req.body || {};
  const requiredTextFields = [title, language, genre, duration];
  if (
    requiredTextFields.some(
      (field) => typeof field !== "string" || !field.trim(),
    ) ||
    !Array.isArray(shows) ||
    shows.length === 0
  ) {
    return res.status(400).json({
      message: "title, language, genre, duration, and shows are required",
    });
  }

  if (
    shows.some((show) => {
      const seats = show?.seats;
      const seatNumbers = Array.isArray(seats)
        ? seats.map((seat) => seat?.seatNumber)
        : [];
      return (
        !show ||
        typeof show.time !== "string" ||
        !show.time.trim() ||
        !Array.isArray(seats) ||
        seats.length === 0 ||
        seatNumbers.some(
          (seatNumber) => typeof seatNumber !== "string" || !seatNumber.trim(),
        ) ||
        new Set(seatNumbers).size !== seatNumbers.length ||
        seats.some((seat) => !["available", "booked"].includes(seat.status))
      );
    })
  ) {
    return res.status(400).json({
      message:
        "Each show needs a time and valid unique seats with available or booked status",
    });
  }

  const result = await sequelize.transaction(async (transaction) => {
    const movie = await Movie.create(
      {
        title: title.trim(),
        language: language.trim(),
        genre: genre.trim(),
        duration: duration.trim(),
      },
      { transaction },
    );

    const createdShows = [];
    for (const show of shows) {
      const createdShow = await Show.create(
        { movieId: movie.id, time: show.time.trim() },
        { transaction },
      );

      const createdSeats = [];
      for (const seat of show.seats) {
        const createdSeat = await Seat.create(
          {
            showId: createdShow.id,
            seatNumber: seat.seatNumber.trim(),
            status: seat.status,
          },
          { transaction },
        );
        createdSeats.push({
          seatNumber: createdSeat.seatNumber,
          status: createdSeat.status,
        });
      }

      createdShows.push({ id: createdShow.id, time: createdShow.time, seats: createdSeats });
    }

    return {
      id: movie.id,
      title: movie.title,
      language: movie.language,
      genre: movie.genre,
      duration: movie.duration,
      shows: createdShows,
    };
  });

  res.status(201).json({
    message: "Movie created successfully",
    movie: result,
  });
};

module.exports = {
  listMovies,
  getMovie,
  listShows,
  getSeats,
  createMovie,
};
