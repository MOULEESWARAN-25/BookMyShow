const { bookings, movies } = require("../data/store");

const createBooking = (req, res) => {
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

  const show = movies
    .flatMap((movie) => movie.shows)
    .find((candidate) => candidate.id === numericShowId);
  if (!show) {
    return res.status(404).json({ message: "Show not found" });
  }

  const requestedSeats = seats.map((seat) => seat.trim());
  const uniqueSeats = [...new Set(requestedSeats)];
  if (uniqueSeats.length !== requestedSeats.length) {
    return res.status(400).json({ message: "Duplicate seats are not allowed" });
  }

  const unavailableSeat = uniqueSeats.find(
    (seatNumber) => !show.seats.some((seat) => seat.seatNumber === seatNumber),
  );
  if (unavailableSeat) {
    return res
      .status(400)
      .json({ message: `Seat ${unavailableSeat} does not exist` });
  }

  const bookedSeat = uniqueSeats.find((seatNumber) =>
    show.seats.some(
      (seat) => seat.seatNumber === seatNumber && seat.status === "booked",
    ),
  );
  if (bookedSeat) {
    return res
      .status(409)
      .json({ message: `Seat ${bookedSeat} is already booked` });
  }

  uniqueSeats.forEach((seatNumber) => {
    const seat = show.seats.find(
      (candidate) => candidate.seatNumber === seatNumber,
    );
    seat.status = "booked";
  });

  const booking = {
    id: bookings.length + 1,
    userId: req.user.userId,
    showId: numericShowId,
    seats: uniqueSeats,
    status: "booked",
  };
  bookings.push(booking);
  res.status(201).json({ message: "Booking created successfully", booking });
};

module.exports = {
  createBooking,
};
