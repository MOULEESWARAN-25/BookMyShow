import { request, download } from "./client";

const createBooking = (showId, seats, idempotencyKey) =>
  request("/bookings", {
    method: "POST",
    body: { showId, seats },
    headers: { "Idempotency-Key": idempotencyKey },
  });

const listMyBookings = () => request("/bookings/mine");

const downloadTicket = (bookingId) => download(`/bookings/${bookingId}/ticket`, "ticket.pdf");

export { createBooking, listMyBookings, downloadTicket };
