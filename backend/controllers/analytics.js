const { QueryTypes } = require("sequelize");
const { sequelize } = require("../models");

const TIMEZONE = "Asia/Kolkata";
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SLOW_SHOWS_LIMIT = 5;
const SLOW_SHOWS_DAYS = 3;
const LATEST_REVIEWS = 50;

const METRICS = `
  count(st.id)::int AS shows,
  coalesce(sum(st.tickets), 0)::int AS tickets,
  coalesce(sum(st.capacity), 0)::int AS capacity,
  coalesce(round(100.0 * sum(st.tickets) / nullif(sum(st.capacity), 0), 1), 0)::float8 AS "occupancyPercent",
  coalesce(sum(sb.revenue), 0)::float8 AS revenue,
  coalesce(sum(sb.bookings), 0)::int AS bookings`;

const isValidDate = (value) =>
  DATE_REGEX.test(value) && !Number.isNaN(Date.parse(value));

const parseFilters = (query) => {
  const { from, to } = query;

  if (from !== undefined && !isValidDate(from)) {
    return { error: "from must be a date in YYYY-MM-DD format" };
  }
  if (to !== undefined && !isValidDate(to)) {
    return { error: "to must be a date in YYYY-MM-DD format" };
  }
  if (from && to && from > to) {
    return { error: "from must be on or before to" };
  }

  return { from, to };
};

const runQuery = (req, filters, selectSql, extraReplacements = {}) => {
  const dateFilters = [];
  if (filters.from) {
    dateFilters.push(
      "AND s.starts_at >= (CAST(:from AS date)::timestamp AT TIME ZONE :timezone)",
    );
  }
  if (filters.to) {
    dateFilters.push(
      "AND s.starts_at < ((CAST(:to AS date) + 1)::timestamp AT TIME ZONE :timezone)",
    );
  }

  const sql = `
    WITH show_stats AS (
      SELECT s.id, s.movie_id, s.theatre_id, s.starts_at,
             count(ss.id)::int AS capacity,
             count(ss.id) FILTER (WHERE ss.status = 'booked')::int AS tickets
        FROM shows s
        JOIN theatres t ON t.id = s.theatre_id
        JOIN show_seats ss ON ss.show_id = s.id
      WHERE (:isSuperAdmin OR t.admin_id = :adminId)
         AND s.cancelled_at IS NULL
         ${dateFilters.join("\n         ")}
       GROUP BY s.id
    ),
    show_bookings AS (
      SELECT b.show_id,
             count(*) FILTER (WHERE b.status = 'confirmed') AS bookings,
             coalesce(sum(b.total_amount) FILTER (WHERE b.status = 'confirmed'), 0) AS revenue
        FROM bookings b
       WHERE b.show_id IN (SELECT id FROM show_stats)
       GROUP BY b.show_id
    )
    ${selectSql}`;

  return sequelize.query(sql, {
    replacements: {
      adminId: req.user.userId,
      isSuperAdmin: req.user.role === "super_admin",
      timezone: TIMEZONE,
      from: filters.from,
      to: filters.to,
      ...extraReplacements,
    },
    type: QueryTypes.SELECT,
  });
};

const getSummary = async (req, res) => {
  const filters = parseFilters(req.query);
  if (filters.error) {
    return res.status(400).json({ message: filters.error });
  }

  const [summary] = await runQuery(
    req,
    filters,
    `SELECT ${METRICS}
       FROM show_stats st
       LEFT JOIN show_bookings sb ON sb.show_id = st.id`,
  );

  res.json({ summary });
};

// Shows in the next few days with the emptiest seats, so a theatre owner knows which ones to promote.
// Shows further ahead are left out: they have simply not had time to sell yet.
// It is a warning about the coming days, so the chosen dates do not apply.
const getSlowShows = async (req, res) => {
  const shows = await runQuery(
    req,
    {},
    `SELECT st.id, st.starts_at AS "startsAt", m.title AS movie, t.name AS theatre,
            st.tickets, st.capacity,
            coalesce(round(100.0 * st.tickets / nullif(st.capacity, 0), 1), 0)::float8 AS "occupancyPercent"
       FROM show_stats st
       JOIN movies m ON m.id = st.movie_id
       JOIN theatres t ON t.id = st.theatre_id
      WHERE st.starts_at > now()
        AND st.starts_at < now() + make_interval(days => :days)
      ORDER BY "occupancyPercent" ASC, st.starts_at ASC
      LIMIT :limit`,
    { limit: SLOW_SHOWS_LIMIT, days: SLOW_SHOWS_DAYS },
  );

  res.json({ shows });
};

// Every ranking lists all rows, best revenue first.
const rankBy = (groupSql, selectColumns, orderColumn) => async (req, res) => {
  const filters = parseFilters(req.query);
  if (filters.error) {
    return res.status(400).json({ message: filters.error });
  }

  const results = await runQuery(
    req,
    filters,
    `SELECT ${selectColumns}, ${METRICS}
       FROM show_stats st
       LEFT JOIN show_bookings sb ON sb.show_id = st.id
       ${groupSql}
      ORDER BY revenue DESC, ${orderColumn} ASC`,
  );

  res.json({ results });
};

const rankMovies = rankBy(
  "JOIN movies m ON m.id = st.movie_id GROUP BY m.id",
  "m.id, m.title, m.language, m.genre",
  "m.title",
);

const rankTheatres = rankBy(
  "JOIN theatres t ON t.id = st.theatre_id GROUP BY t.id",
  "t.id, t.name, t.city",
  "t.name",
);

// The two rankings below are for the site owner, who looks across every theatre owner.
const rankOwners = rankBy(
  "JOIN theatres t ON t.id = st.theatre_id JOIN users u ON u.id = t.admin_id GROUP BY u.id",
  "u.id, u.name, count(DISTINCT t.id)::int AS theatres",
  "u.name",
);

const rankCities = rankBy(
  "JOIN theatres t ON t.id = st.theatre_id GROUP BY t.city",
  "t.city, count(DISTINCT t.id)::int AS theatres",
  "t.city",
);

// The site owner's summary: money and seats for the chosen dates, plus how big the platform is.
const getSiteSummary = async (req, res) => {
  const filters = parseFilters(req.query);
  if (filters.error) {
    return res.status(400).json({ message: filters.error });
  }

  const [summary] = await runQuery(
    req,
    filters,
    `SELECT ${METRICS},
            (SELECT count(DISTINCT b.user_id) FROM bookings b
              WHERE b.status = 'confirmed' AND b.show_id IN (SELECT id FROM show_stats))::int AS "customersWhoBooked",
            (SELECT count(*) FROM users WHERE role = 'user')::int AS "registeredCustomers",
            (SELECT count(*) FROM users WHERE role = 'admin')::int AS "theatreOwners",
            (SELECT count(*) FROM theatres)::int AS theatres,
            (SELECT count(DISTINCT city) FROM theatres)::int AS cities
       FROM show_stats st
       LEFT JOIN show_bookings sb ON sb.show_id = st.id`,
  );

  res.json({ summary });
};

const getDaily = async (req, res) => {
  const filters = parseFilters(req.query);
  if (filters.error) {
    return res.status(400).json({ message: filters.error });
  }

  const days = await runQuery(
    req,
    filters,
    `SELECT to_char(st.starts_at AT TIME ZONE :timezone, 'YYYY-MM-DD') AS date, ${METRICS}
       FROM show_stats st
       LEFT JOIN show_bookings sb ON sb.show_id = st.id
      GROUP BY 1
      ORDER BY 1`,
  );

  res.json({ days });
};

const getShowTimes = async (req, res) => {
  const filters = parseFilters(req.query);
  if (filters.error) {
    return res.status(400).json({ message: filters.error });
  }

  const [byShowTime, byWeekday] = await Promise.all([
    runQuery(
      req,
      filters,
      `SELECT to_char(st.starts_at AT TIME ZONE :timezone, 'HH24:MI') AS "showTime", ${METRICS}
         FROM show_stats st
         LEFT JOIN show_bookings sb ON sb.show_id = st.id
        GROUP BY 1
        ORDER BY 1`,
    ),
    runQuery(
      req,
      filters,
      `SELECT to_char(st.starts_at AT TIME ZONE :timezone, 'FMDay') AS weekday, ${METRICS}
         FROM show_stats st
         LEFT JOIN show_bookings sb ON sb.show_id = st.id
        GROUP BY 1, extract(isodow FROM st.starts_at AT TIME ZONE :timezone)
        ORDER BY extract(isodow FROM st.starts_at AT TIME ZONE :timezone)`,
    ),
  ]);

  res.json({ byShowTime, byWeekday });
};

const getGenres = async (req, res) => {
  const filters = parseFilters(req.query);
  if (filters.error) {
    return res.status(400).json({ message: filters.error });
  }

  const groupByMovieColumn = (column, alias) =>
    runQuery(
      req,
      filters,
      `SELECT m.${column} AS ${alias}, ${METRICS}
         FROM show_stats st
         JOIN movies m ON m.id = st.movie_id
         LEFT JOIN show_bookings sb ON sb.show_id = st.id
        GROUP BY m.${column}
        ORDER BY tickets DESC, m.${column} ASC`,
    );

  const [byGenre, byLanguage] = await Promise.all([
    groupByMovieColumn("genre", "genre"),
    groupByMovieColumn("language", "language"),
  ]);

  res.json({ byGenre, byLanguage });
};

// What customers said about the owner's shows. Reviews are joined to show_stats, so they follow
// the same rules as every other number here: the owner's own theatres, the chosen dates, live shows.
const getReviews = async (req, res) => {
  const filters = parseFilters(req.query);
  if (filters.error) {
    return res.status(400).json({ message: filters.error });
  }

  const fromReviews = `
      FROM reviews r
      JOIN bookings b ON b.id = r.booking_id
      JOIN show_stats st ON st.id = b.show_id`;

  const [[summary], byTheatre, likedAspects, reviews] = await Promise.all([
    runQuery(
      req,
      filters,
      `SELECT count(*)::int AS "reviewCount",
              coalesce(round(avg(r.movie_rating), 1), 0)::float8 AS "averageMovieRating",
              coalesce(round(avg(r.theatre_rating), 1), 0)::float8 AS "averageTheatreRating"
         ${fromReviews}`,
    ),
    runQuery(
      req,
      filters,
      `SELECT t.name, round(avg(r.theatre_rating), 1)::float8 AS "averageTheatreRating"
         ${fromReviews}
         JOIN theatres t ON t.id = st.theatre_id
        GROUP BY t.id
        ORDER BY "averageTheatreRating" DESC, t.name`,
    ),
    runQuery(
      req,
      filters,
      `SELECT aspect, count(*)::int AS count
         ${fromReviews}
         CROSS JOIN unnest(r.liked_aspects) AS aspect
        GROUP BY aspect
        ORDER BY count DESC, aspect`,
    ),
    runQuery(
      req,
      filters,
      `SELECT r.id, split_part(u.name, ' ', 1) AS "customerName",
              m.title AS movie, t.name AS theatre, st.starts_at AS "startsAt",
              r.movie_rating AS "movieRating", r.theatre_rating AS "theatreRating",
              r.liked_aspects AS "likedAspects", r.comment, r.created_at AS "createdAt"
         ${fromReviews}
         JOIN movies m ON m.id = st.movie_id
         JOIN theatres t ON t.id = st.theatre_id
         JOIN users u ON u.id = b.user_id
        ORDER BY r.created_at DESC
        LIMIT :limit`,
      { limit: LATEST_REVIEWS },
    ),
  ]);

  res.json({ summary, byTheatre, likedAspects, reviews });
};

module.exports = {
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
  getReviews,
};
