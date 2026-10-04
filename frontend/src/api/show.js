import { request } from "./client";

const getSeats = (showId) => request(`/shows/${showId}/seats`);

const createShow = (show) => request("/shows", { method: "POST", body: show });

const updateShow = (showId, show) =>
  request(`/shows/${showId}`, { method: "PATCH", body: show });

const deleteShow = (showId) => request(`/shows/${showId}`, { method: "DELETE" });

const addSeats = (showId, seatRows, seatsPerRow) =>
  request(`/shows/${showId}/seats`, { method: "POST", body: { seatRows, seatsPerRow } });

const deleteSeat = (showId, seatNumber) =>
  request(`/shows/${showId}/seats/${seatNumber}`, { method: "DELETE" });

export { getSeats, createShow, updateShow, deleteShow, addSeats, deleteSeat };
