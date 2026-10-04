import { request, toQuery } from "./client";

const listMovies = (search, theatre) => request(`/movies${toQuery({ search, theatre })}`);

const listAllMovies = () => request("/movies/all");

const listMyMovies = () => request("/movies/mine");

const getMovie = (movieId) => request(`/movies/${movieId}`);

const listShows = (movieId, theatreId) =>
  request(`/movies/${movieId}/shows${toQuery({ theatreId })}`);

const createMovie = (movie) => request("/movies", { method: "POST", body: movie });

const updateMovie = (movieId, movie) =>
  request(`/movies/${movieId}`, { method: "PATCH", body: movie });

const deleteMovie = (movieId) => request(`/movies/${movieId}`, { method: "DELETE" });

export {
  listMovies,
  listAllMovies,
  listMyMovies,
  getMovie,
  listShows,
  createMovie,
  updateMovie,
  deleteMovie,
};
