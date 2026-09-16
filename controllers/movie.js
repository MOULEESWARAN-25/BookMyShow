const { movies } = require("../data/store");

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const findMovie = (value) => {
  const id = parseId(value);
  return id ? movies.find((candidate) => candidate.id === id) : undefined;
};

const listMovies = (req, res) => {
  res.status(200).json({ movies: movies.map(({ shows, ...movie }) => movie) });
};

const getMovie = (req, res) => {
  const movieId = parseId(req.params.movieId);
  if (!movieId) {
    return res
      .status(400)
      .json({ message: "movieId must be a positive integer" });
  }

  const movie = findMovie(movieId);
  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  res.status(200).json({ movie });
};

const listShows = (req, res) => {
  const movieId = parseId(req.params.movieId);
  if (!movieId) {
    return res
      .status(400)
      .json({ message: "movieId must be a positive integer" });
  }

  const movie = findMovie(movieId);
  if (!movie) {
    return res.status(404).json({ message: "Movie not found" });
  }

  res.status(200).json({ shows: movie.shows });
};

const getSeats = (req, res) => {
  const showId = parseId(req.params.showId);
  if (!showId) {
    return res
      .status(400)
      .json({ message: "showId must be a positive integer" });
  }

  const movie = movies.find((candidate) =>
    candidate.shows.some((show) => show.id === showId),
  );
  const show = movie?.shows.find((candidate) => candidate.id === showId);
  if (!show) {
    return res.status(404).json({ message: "Show not found" });
  }

  res.status(200).json({ showId: show.id, seats: show.seats });
};

const createMovie = (req, res) => {
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

  const existingShowIds = new Set(
    movies.flatMap((movie) => movie.shows.map((show) => show.id)),
  );
  const nextShowId =
    movies
      .flatMap((movie) => movie.shows.map((show) => show.id))
      .reduce((maxId, showId) => Math.max(maxId, Number(showId) || 0), 0) + 1;
  const showIds = new Set();

  if (
    shows.some((show, index) => {
      const showId =
        show && (show.id === undefined ? nextShowId + index : parseId(show.id));
      const seats = show?.seats;
      const seatNumbers = Array.isArray(seats)
        ? seats.map((seat) => seat?.seatNumber)
        : [];
      const isDuplicateShowId =
        showId && (existingShowIds.has(showId) || showIds.has(showId));
      if (showId) showIds.add(showId);
      return (
        !show ||
        typeof show.time !== "string" ||
        !show.time.trim() ||
        !Array.isArray(seats) ||
        seats.length === 0 ||
        !showId ||
        isDuplicateShowId ||
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
        "Each show needs a unique id, time, and valid unique seats with available or booked status",
    });
  }

  const movie = {
    id: movies.length + 1,
    title: title.trim(),
    language: language.trim(),
    genre: genre.trim(),
    duration: duration.trim(),
    shows: shows.map((show, index) => ({
      id: show.id === undefined ? nextShowId + index : parseId(show.id),
      time: show.time.trim(),
      seats: show.seats.map((seat) => ({
        seatNumber: seat.seatNumber.trim(),
        status: seat.status,
      })),
    })),
  };
  movies.push(movie);
  res.status(201).json({ message: "Movie created successfully", movie });
};

module.exports = {
  listMovies,
  getMovie,
  listShows,
  getSeats,
  createMovie,
};
