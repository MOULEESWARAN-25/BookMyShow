import { request, toQuery } from "./client";

const getSummary = (filters) => request(`/analytics/summary${toQuery(filters)}`);

const rankMovies = (filters) => request(`/analytics/movies${toQuery(filters)}`);

const rankTheatres = (filters) => request(`/analytics/theatres${toQuery(filters)}`);

const getDaily = (filters) => request(`/analytics/daily${toQuery(filters)}`);

const getShowTimes = (filters) => request(`/analytics/show-times${toQuery(filters)}`);

const getGenres = (filters) => request(`/analytics/genres${toQuery(filters)}`);

export { getSummary, rankMovies, rankTheatres, getDaily, getShowTimes, getGenres };
