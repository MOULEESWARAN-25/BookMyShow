import { request } from "./client";

const createTheatre = (name, city) =>
  request("/theatres", { method: "POST", body: { name, city } });

const listMyTheatres = () => request("/theatres/mine");

const listTheatreShows = (theatreId) => request(`/theatres/${theatreId}/shows`);

const updateTheatre = (theatreId, name, city) =>
  request(`/theatres/${theatreId}`, { method: "PATCH", body: { name, city } });

const deleteTheatre = (theatreId) => request(`/theatres/${theatreId}`, { method: "DELETE" });

export { createTheatre, listMyTheatres, listTheatreShows, updateTheatre, deleteTheatre };
