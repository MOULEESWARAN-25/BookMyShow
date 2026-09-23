"use strict";

const { USERS, MOVIES, THEATRES, SHOW_SLOTS } = require("../db/seedData");

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_TARGET_OCCUPANCY = 0.95;
const CANCELLATION_RATE = 0.06;
const GROUP_SIZES = [1, 2, 2, 2, 3, 4, 4, 5];

const createRandom = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const pickSeats = (freeSeats, size, random) => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const start = Math.floor(random() * freeSeats.length);
    const block = freeSeats.slice(start, start + size);
    const sameRow = block.every(
      (seat) => seat.seat_number[0] === block[0].seat_number[0],
    );
    if (block.length === size && sameRow) {
      return block;
    }
  }
  return freeSeats.slice(0, size);
};

const seededUserIds = (queryInterface) =>
  queryInterface.sequelize.query("SELECT id FROM users WHERE email IN (:emails)", {
    replacements: { emails: USERS.map((user) => user.email) },
    type: queryInterface.sequelize.QueryTypes.SELECT,
  });

module.exports = {
  up: async (queryInterface) => {
    const { sequelize } = queryInterface;
    const { QueryTypes } = sequelize;
    const random = createRandom(42);
    const now = Date.now();

    const userIds = (await seededUserIds(queryInterface)).map((user) => user.id);
    const shows = await sequelize.query(
      `SELECT s.id, s.starts_at, s.price, m.title
         FROM shows s
         JOIN movies m ON m.id = s.movie_id
         JOIN theatres t ON t.id = s.theatre_id
        WHERE t.name IN (:names)
        ORDER BY s.id`,
      {
        replacements: { names: THEATRES.map((theatre) => theatre.name) },
        type: QueryTypes.SELECT,
      },
    );
    const seats = await sequelize.query(
      "SELECT id, show_id, seat_number FROM show_seats WHERE show_id IN (:showIds) ORDER BY id",
      {
        replacements: { showIds: shows.map((show) => show.id) },
        type: QueryTypes.SELECT,
      },
    );

    const seatsByShow = new Map();
    for (const seat of seats) {
      if (!seatsByShow.has(seat.show_id)) seatsByShow.set(seat.show_id, []);
      seatsByShow.get(seat.show_id).push(seat);
    }
    const popularity = new Map(MOVIES.map((movie) => [movie.title, movie.popularity]));

    const bookings = [];
    const bookingSeats = [];
    for (const show of shows) {
      const startsAt = new Date(show.starts_at);
      const slot =
        SHOW_SLOTS.find(
          (s) => s.hour === startsAt.getHours() && s.minute === startsAt.getMinutes(),
        ) ?? SHOW_SLOTS[0];
      const isWeekend = [0, 6].includes(startsAt.getDay());
      const daysAhead = (startsAt.getTime() - now) / DAY_MS;

      let occupancy =
        popularity.get(show.title) *
        slot.demand *
        (isWeekend ? 1.2 : 1) *
        (0.8 + random() * 0.4);
      if (daysAhead > 0) {
        occupancy *= Math.max(0.1, 0.7 - 0.1 * daysAhead);
      }
      occupancy = Math.min(occupancy, MAX_TARGET_OCCUPANCY);

      const freeSeats = [...seatsByShow.get(show.id)];
      const targetSeats = Math.round(occupancy * freeSeats.length);
      let bookedCount = 0;

      while (bookedCount < targetSeats && freeSeats.length > 0) {
        const size = Math.min(
          GROUP_SIZES[Math.floor(random() * GROUP_SIZES.length)],
          freeSeats.length,
        );
        const chosen = pickSeats(freeSeats, size, random);
        const cancelled = random() < CANCELLATION_RATE;

        const latest = Math.min(startsAt.getTime() - 30 * 60 * 1000, now);
        const earliest = Math.min(startsAt.getTime() - 7 * DAY_MS, latest);
        const createdAt = new Date(earliest + random() * (latest - earliest));

        bookings.push({
          user_id: userIds[Math.floor(random() * userIds.length)],
          show_id: show.id,
          total_amount: (Number(show.price) * chosen.length).toFixed(2),
          status: cancelled ? "cancelled" : "confirmed",
          created_at: createdAt,
        });
        bookingSeats.push(chosen.map((seat) => seat.id));

        if (!cancelled) {
          for (const seat of chosen) freeSeats.splice(freeSeats.indexOf(seat), 1);
          bookedCount += chosen.length;
        }
      }
    }

    const inserted = await queryInterface.bulkInsert("bookings", bookings, {
      returning: ["id"],
    });

    await queryInterface.bulkInsert(
      "booking_seats",
      inserted.flatMap((booking, index) =>
        bookingSeats[index].map((showSeatId) => ({
          booking_id: booking.id,
          show_seat_id: showSeatId,
        })),
      ),
    );

    const bookedSeatIds = inserted.flatMap((booking, index) =>
      bookings[index].status === "confirmed" ? bookingSeats[index] : [],
    );
    await sequelize.query(
      "UPDATE show_seats SET status = 'booked' WHERE id IN (:ids)",
      { replacements: { ids: bookedSeatIds } },
    );
  },

  down: async (queryInterface) => {
    const userIds = (await seededUserIds(queryInterface)).map((user) => user.id);
    if (userIds.length === 0) return;

    await queryInterface.sequelize.query(
      `UPDATE show_seats SET status = 'available'
        WHERE id IN (
          SELECT bs.show_seat_id
            FROM booking_seats bs
            JOIN bookings b ON b.id = bs.booking_id
           WHERE b.user_id IN (:userIds) AND b.status = 'confirmed'
        )`,
      { replacements: { userIds } },
    );
    await queryInterface.bulkDelete("bookings", { user_id: userIds });
  },
};
