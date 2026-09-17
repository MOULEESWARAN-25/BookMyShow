const pool = require("../db/pool");

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const listMovies = async (req, res) => {
  const result = await pool.query(
    "SELECT id, title, language, genre, duration FROM movies ORDER BY id",
  );
  res.status(200).json({ movies: result.rows });
};

const getMovie = async (req, res) => {
  const movieId = parseId(req.params.movieId);
  if (!movieId) {
    return res
      .status(400)
      .json({ message: "movieId must be a positive integer" });
  }

  const result = await pool.query(
    "SELECT id, title, language, genre, duration FROM movies WHERE id = $1",
    [movieId],
  );
  const movie = result.rows[0];
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

  const movieResult = await pool.query("SELECT id FROM movies WHERE id = $1", [movieId]);
  if (!movieResult.rows[0]) {
    return res.status(404).json({ message: "Movie not found" });
  }

  const showsResult = await pool.query(
    "SELECT id, time FROM shows WHERE movie_id = $1 ORDER BY id",
    [movieId],
  );
  res.status(200).json({ shows: showsResult.rows });
};

const getSeats = async (req, res) => {
  const showId = parseId(req.params.showId);
  if (!showId) {
    return res
      .status(400)
      .json({ message: "showId must be a positive integer" });
  }

  const showResult = await pool.query("SELECT id FROM shows WHERE id = $1", [showId]);
  if (!showResult.rows[0]) {
    return res.status(404).json({ message: "Show not found" });
  }

  const seatsResult = await pool.query(
    "SELECT seat_number AS \"seatNumber\", status FROM seats WHERE show_id = $1 ORDER BY seat_number",
    [showId],
  );
  res.status(200).json({ showId, seats: seatsResult.rows });
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

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const movieResult = await client.query(
      "INSERT INTO movies (title, language, genre, duration) VALUES ($1, $2, $3, $4) RETURNING id, title, language, genre, duration",
      [title.trim(), language.trim(), genre.trim(), duration.trim()],
    );
    const movie = movieResult.rows[0];

    const createdShows = [];
    for (const show of shows) {
      const showResult = await client.query(
        "INSERT INTO shows (movie_id, time) VALUES ($1, $2) RETURNING id, time",
        [movie.id, show.time.trim()],
      );
      const createdShow = showResult.rows[0];

      const createdSeats = [];
      for (const seat of show.seats) {
        const seatResult = await client.query(
          "INSERT INTO seats (show_id, seat_number, status) VALUES ($1, $2, $3) RETURNING seat_number AS \"seatNumber\", status",
          [createdShow.id, seat.seatNumber.trim(), seat.status],
        );
        createdSeats.push(seatResult.rows[0]);
      }

      createdShows.push({ ...createdShow, seats: createdSeats });
    }

    await client.query("COMMIT");
    res.status(201).json({
      message: "Movie created successfully",
      movie: { ...movie, shows: createdShows },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  listMovies,
  getMovie,
  listShows,
  getSeats,
  createMovie,
};
