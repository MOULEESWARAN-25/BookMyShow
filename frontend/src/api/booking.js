import { request, download } from "./client";

const createBooking = (showId, seats, idempotencyKey) =>
  request("/bookings", {
    method: "POST",
    body: { showId, seats },
    headers: { "Idempotency-Key": idempotencyKey },
  });

const listMyBookings = () => request("/bookings/mine");

const downloadTicket = (bookingId) => download(`/bookings/${bookingId}/ticket`, "ticket.pdf");

// Sends the customer's review of a show they watched. A booking can be reviewed only once.
const createReview = (bookingId, review) =>
  request(`/bookings/${bookingId}/review`, { method: "POST", body: review });

export { createBooking, listMyBookings, downloadTicket, createReview };
