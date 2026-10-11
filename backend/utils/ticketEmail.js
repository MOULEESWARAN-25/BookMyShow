const { Booking, User, Show, Movie, Theatre, ShowSeat } = require("../models");
const { sendMail } = require("./mailer");
const { buildTicketPdf } = require("./ticketPdf");
const { logger } = require("./logger");
const { openTrackingUrl } = require("./emailTracking");

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

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const textToHtml = (text, bookingId) =>
  `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1c1f26;">${text
    .split("\n\n")
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("")}</div><img src="${openTrackingUrl(bookingId)}" width="1" height="1" alt="" style="display:block;border:0;">`;

const ticketAttachment = (ticket, pdf) => ({
  filename: `ticket-${ticket.code}.pdf`,
  content: pdf,
  contentType: "application/pdf",
});

const loadTicket = async (bookingId) => {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      { model: User, attributes: ["name", "email"] },
      { model: Show, include: [Movie, { model: Theatre, as: "theatre" }] },
      {
        model: ShowSeat,
        as: "seats",
        attributes: ["seatNumber"],
        through: { attributes: [] },
      },
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
    movieInfo: [
      movie.language,
      movie.genre,
      `${movie.durationMinutes} min`,
    ].join(" · "),
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
  const booking = await Booking.findByPk(bookingId, {
    attributes: ["id", "ticketSentAt"],
  });
  if (!booking) {
    logger.warn(`Booking ${bookingId} no longer exists, no ticket to send`);
    return;
  }
  if (booking.ticketSentAt) {
    logger.info(
      `Ticket for booking ${bookingId} was already sent at ${booking.ticketSentAt.toISOString()}, skipping`,
    );
    return;
  }

  const ticket = await loadTicket(bookingId);
  const pdf = await buildTicketPdf(ticket);

  const text = buildTicketText(ticket);
  await sendMail({
    to: ticket.email,
    subject: `Your tickets for ${ticket.movieTitle} · ${ticket.date}, ${ticket.startTime}`,
    text,
    html: textToHtml(text, bookingId),
    attachments: [ticketAttachment(ticket, pdf)],
  });
  await Booking.update(
    { ticketSentAt: new Date() },
    { where: { id: bookingId } },
  );
  logger.info(
    `Ticket ${ticket.code} for booking ${bookingId} sent to ${ticket.email}`,
  );
};

const buildReminderText = (ticket) =>
  [
    `Hi ${ticket.userName},`,
    "",
    `${ticket.movieTitle} starts in 30 minutes, at ${ticket.startTime}. Your ticket is attached again in case you need it.`,
    "",
    `Theatre:    ${ticket.theatreName}, ${ticket.theatreCity}`,
    `Seats:      ${ticket.seats.join(", ")}`,
    `Booking ID: ${ticket.code}`,
    "",
    "Show the ticket at the entrance. Enjoy the show!",
  ].join("\n");

const sendShowReminder = async (bookingId) => {
  const booking = await Booking.findByPk(bookingId, {
    attributes: ["id", "status", "ticketOpenedAt", "reminderSentAt"],
    include: [{ model: Show, attributes: ["startsAt"] }],
  });
  if (!booking || booking.status !== "confirmed") {
    logger.info(`Booking ${bookingId} is gone or cancelled, no reminder needed`);
    return;
  }
  if (booking.ticketOpenedAt) {
    logger.info(
      `Booking ${bookingId}: ticket email was opened at ${booking.ticketOpenedAt.toISOString()}, no reminder needed`,
    );
    return;
  }
  if (booking.reminderSentAt) {
    logger.info(
      `Booking ${bookingId}: reminder already sent at ${booking.reminderSentAt.toISOString()}, skipping`,
    );
    return;
  }
  if (booking.Show.startsAt <= new Date()) {
    logger.info(`Booking ${bookingId}: show has already started, reminder skipped`);
    return;
  }

  const ticket = await loadTicket(bookingId);
  const pdf = await buildTicketPdf(ticket);
  const text = buildReminderText(ticket);

  await sendMail({
    to: ticket.email,
    subject: `Reminder: ${ticket.movieTitle} starts at ${ticket.startTime} today`,
    text,
    html: textToHtml(text, bookingId),
    attachments: [ticketAttachment(ticket, pdf)],
  });
  await Booking.update(
    { reminderSentAt: new Date() },
    { where: { id: bookingId } },
  );
  logger.info(`Reminder for booking ${bookingId} sent to ${ticket.email}`);
};

const sendShowUpdatedEmail = async (bookingId, startsAt) => {
  const booking = await Booking.findByPk(bookingId, {
    attributes: ["id", "status"],
    include: [{ model: Show, attributes: ["startsAt", "cancelledAt"] }],
  });
  if (!booking || booking.status !== "confirmed" || booking.Show.cancelledAt) {
    logger.info(`Booking ${bookingId} is no longer active, no time-change email needed`);
    return;
  }
  if (booking.Show.startsAt.getTime() !== new Date(startsAt).getTime()) {
    logger.info(
      `Booking ${bookingId}: show time changed again since this email was queued, skipping`,
    );
    return;
  }

  const ticket = await loadTicket(bookingId);
  const pdf = await buildTicketPdf(ticket);
  const text = [
    `Hi ${ticket.userName},`,
    "",
    `The time of your show for ${ticket.movieTitle} has changed.`,
    "",
    `New date:   ${ticket.date}`,
    `New time:   ${ticket.time}`,
    `Theatre:    ${ticket.theatreName}, ${ticket.theatreCity}`,
    `Seats:      ${ticket.seats.join(", ")}`,
    `Booking ID: ${ticket.code}`,
    "",
    "Your updated ticket is attached. Your seats stay the same.",
  ].join("\n");

  await sendMail({
    to: ticket.email,
    subject: `Show time changed: ${ticket.movieTitle} is now on ${ticket.date}, ${ticket.startTime}`,
    text,
    html: textToHtml(text, bookingId),
    attachments: [ticketAttachment(ticket, pdf)],
  });
  logger.info(`Time-change email for booking ${bookingId} sent to ${ticket.email}`);
};

const sendShowCancelledEmail = async (bookingId) => {
  const booking = await Booking.findByPk(bookingId, { attributes: ["id", "status"] });
  if (!booking || booking.status !== "cancelled") {
    logger.info(`Booking ${bookingId} is not cancelled, no cancellation email needed`);
    return;
  }

  const ticket = await loadTicket(bookingId);
  const text = [
    `Hi ${ticket.userName},`,
    "",
    `We are sorry: the show for ${ticket.movieTitle} on ${ticket.date} at ${ticket.startTime} at ${ticket.theatreName}, ${ticket.theatreCity} has been cancelled by the theatre.`,
    "",
    `Your booking ${ticket.code} (seats ${ticket.seats.join(", ")}) has been cancelled.`,
  ].join("\n");

  await sendMail({
    to: ticket.email,
    subject: `Show cancelled: ${ticket.movieTitle} on ${ticket.date}, ${ticket.startTime}`,
    text,
    html: textToHtml(text, bookingId),
  });
  logger.info(`Cancellation email for booking ${bookingId} sent to ${ticket.email}`);
};

module.exports = {
  loadTicket,
  sendBookingTicket,
  sendShowReminder,
  sendShowUpdatedEmail,
  sendShowCancelledEmail,
};
