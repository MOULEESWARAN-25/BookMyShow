import { request, toQuery } from "./client";

const getSummary = (filters) => request(`/analytics/summary${toQuery(filters)}`);

// Always the next few days, whatever dates are chosen.
const getSlowShows = () => request("/analytics/slow-shows");

const rankMovies = (filters) => request(`/analytics/movies${toQuery(filters)}`);

const rankTheatres = (filters) => request(`/analytics/theatres${toQuery(filters)}`);

// For the site owner only.
const getSiteSummary = (filters) => request(`/analytics/site-summary${toQuery(filters)}`);

const rankOwners = (filters) => request(`/analytics/owners${toQuery(filters)}`);

const rankCities = (filters) => request(`/analytics/cities${toQuery(filters)}`);

const getDaily = (filters) => request(`/analytics/daily${toQuery(filters)}`);

const getShowTimes = (filters) => request(`/analytics/show-times${toQuery(filters)}`);

const getGenres = (filters) => request(`/analytics/genres${toQuery(filters)}`);

export {
  getSummary,
  getSlowShows,
  getSiteSummary,
  rankMovies,
  rankTheatres,
  rankOwners,
  rankCities,
  getDaily,
  getShowTimes,
  getGenres,
};
