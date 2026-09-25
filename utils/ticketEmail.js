const { Booking, User, Show, Movie, Theatre, ShowSeat } = require("../models");
const { sendMail } = require("./mailer");
const { buildTicketPdf } = require("./ticketPdf");
const { logger } = require("./logger");

const TIMEZONE = "Asia/Kolkata";

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

const formatTime = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

const formatAmount = (amount) =>
  `Rs. ${new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(amount)}`;

const loadTicket = async (bookingId) => {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      { model: User, attributes: ["name", "email"] },
      { model: Show, include: [Movie, { model: Theatre, as: "theatre" }] },
      { model: ShowSeat, as: "seats", attributes: ["seatNumber"], through: { attributes: [] } },
    ],
  });
  const { User: user, Show: show } = booking;
  const { Movie: movie, theatre } = show;
  const seats = booking.seats
    .map((seat) => seat.seatNumber)
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

  return {
    email: user.email,
    code: `BMS${String(booking.id).padStart(6, "0")}`,
    userName: user.name,
    movieTitle: movie.title,
    movieInfo: [movie.language, movie.genre, `${movie.durationMinutes} min`].join(" · "),
    theatreName: theatre.name,
    theatreCity: theatre.city,
    date: formatDate(show.startsAt),
    startTime: formatTime(show.startsAt),
    time: `${formatTime(show.startsAt)} – ${formatTime(show.endsAt)}`,
    seats,
    ticketsLine: `${seats.length} × ${formatAmount(show.price)}`,
    amount: formatAmount(booking.totalAmount),
    bookedBy: `${user.name}\n${user.email}`,
    bookedOn: `${formatDate(booking.createdAt)}, ${formatTime(booking.createdAt)}`,
  };
};

const buildTicketText = (ticket) =>
  [
    `Hi ${ticket.userName},`,
    "",
    `Your booking for ${ticket.movieTitle} is confirmed. Your ticket is attached as a PDF.`,
    "",
    `Theatre:    ${ticket.theatreName}, ${ticket.theatreCity}`,
    `Date:       ${ticket.date}`,
    `Time:       ${ticket.time}`,
    `Seats:      ${ticket.seats.join(", ")}`,
    `Booking ID: ${ticket.code}`,
    "",
    "Show the ticket at the entrance. Please arrive 15 minutes before the show.",
  ].join("\n");

const sendBookingTicket = async (bookingId) => {
  const ticket = await loadTicket(bookingId);
  const pdf = await buildTicketPdf(ticket);

  await sendMail({
    to: ticket.email,
    subject: `Your tickets for ${ticket.movieTitle} · ${ticket.date}, ${ticket.startTime}`,
    text: buildTicketText(ticket),
    attachments: [
      { filename: `ticket-${ticket.code}.pdf`, content: pdf, contentType: "application/pdf" },
    ],
  });
  logger.info(`Ticket ${ticket.code} for booking ${bookingId} sent to ${ticket.email}`);
};

module.exports = { loadTicket, buildTicketText, sendBookingTicket };
