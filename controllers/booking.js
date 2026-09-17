const pool = require("../db/pool");

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

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const showResult = await client.query("SELECT id FROM shows WHERE id = $1", [numericShowId]);
    if (!showResult.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Show not found" });
    }

    const seatsResult = await client.query(
      "SELECT seat_number AS \"seatNumber\", status FROM seats WHERE show_id = $1 AND seat_number = ANY($2) FOR UPDATE",
      [numericShowId, uniqueSeats],
    );

    const foundSeats = new Map(seatsResult.rows.map((seat) => [seat.seatNumber, seat.status]));
    const unavailableSeat = uniqueSeats.find((seatNumber) => !foundSeats.has(seatNumber));
    if (unavailableSeat) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: `Seat ${unavailableSeat} does not exist` });
    }

    const bookedSeat = uniqueSeats.find((seatNumber) => foundSeats.get(seatNumber) === "booked");
    if (bookedSeat) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: `Seat ${bookedSeat} is already booked` });
    }

    await client.query(
      "UPDATE seats SET status = 'booked' WHERE show_id = $1 AND seat_number = ANY($2)",
      [numericShowId, uniqueSeats],
    );

    const bookingResult = await client.query(
      "INSERT INTO bookings (user_id, show_id, seats, status) VALUES ($1, $2, $3, $4) RETURNING id, user_id AS \"userId\", show_id AS \"showId\", seats, status",
      [req.user.userId, numericShowId, uniqueSeats, "booked"],
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Booking created successfully", booking: bookingResult.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createBooking,
};
