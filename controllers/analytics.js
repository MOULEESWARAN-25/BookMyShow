const { QueryTypes } = require("sequelize");
const { sequelize } = require("../models");

const TIMEZONE = "Asia/Kolkata";
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 50;

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

const parseRanking = (query) => {
  const { sort = "most", limit = String(DEFAULT_LIMIT) } = query;

  if (!["most", "least"].includes(sort)) {
    return { error: "sort must be most or least" };
  }

  const numericLimit = Number(limit);
  if (
    !Number.isInteger(numericLimit) ||
    numericLimit < 1 ||
    numericLimit > MAX_LIMIT
  ) {
    return { error: `limit must be an integer between 1 and ${MAX_LIMIT}` };
  }

  return { direction: sort === "most" ? "DESC" : "ASC", limit: numericLimit };
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
       WHERE t.admin_id = :adminId
         ${dateFilters.join("\n         ")}
       GROUP BY s.id
    ),
    show_bookings AS (
      SELECT b.show_id,
             count(*) FILTER (WHERE b.status = 'confirmed') AS bookings,
             count(*) FILTER (WHERE b.status = 'cancelled') AS cancellations,
             coalesce(sum(b.total_amount) FILTER (WHERE b.status = 'confirmed'), 0) AS revenue
        FROM bookings b
       WHERE b.show_id IN (SELECT id FROM show_stats)
       GROUP BY b.show_id
    )
    ${selectSql}`;

  return sequelize.query(sql, {
    replacements: {
      adminId: req.user.userId,
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
    `SELECT ${METRICS},
            count(st.id) FILTER (WHERE st.starts_at > now())::int AS "upcomingShows",
            coalesce(sum(sb.cancellations), 0)::int AS cancellations,
            coalesce(round(100.0 * sum(sb.cancellations) / nullif(sum(sb.bookings) + sum(sb.cancellations), 0), 1), 0)::float8 AS "cancellationRatePercent"
       FROM show_stats st
       LEFT JOIN show_bookings sb ON sb.show_id = st.id`,
  );

  res.status(200).json({ summary });
};

const rankBy = (groupSql, selectColumns, orderColumn) => async (req, res) => {
  const filters = parseFilters(req.query);
  const ranking = parseRanking(req.query);
  const error = filters.error || ranking.error;
  if (error) {
    return res.status(400).json({ message: error });
  }

  const results = await runQuery(
    req,
    filters,
    `SELECT ${selectColumns}, ${METRICS}
       FROM show_stats st
       LEFT JOIN show_bookings sb ON sb.show_id = st.id
       ${groupSql}
      ORDER BY tickets ${ranking.direction}, ${orderColumn} ASC
      LIMIT :limit`,
    { limit: ranking.limit },
  );

  res.status(200).json({ results });
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

  res.status(200).json({ days });
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

  res.status(200).json({ byShowTime, byWeekday });
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

  res.status(200).json({ byGenre, byLanguage });
};

module.exports = {
  getSummary,
  rankMovies,
  rankTheatres,
  getDaily,
  getShowTimes,
  getGenres,
};
