"use strict";

const {
  MOVIES,
  THEATRES,
  SHOW_SLOTS,
  PAST_DAYS,
  FUTURE_DAYS,
} = require("../db/seedData");

const BREAK_MINUTES = 15;

module.exports = {
  up: async (queryInterface) => {
    const { QueryTypes } = queryInterface.sequelize;
    const theatres = await queryInterface.sequelize.query(
      "SELECT id, name FROM theatres WHERE name IN (:names)",
      {
        replacements: { names: THEATRES.map((theatre) => theatre.name) },
        type: QueryTypes.SELECT,
      },
    );
    const movies = await queryInterface.sequelize.query(
      "SELECT id, title, duration_minutes FROM movies WHERE title IN (:titles)",
      {
        replacements: { titles: MOVIES.map((movie) => movie.title) },
        type: QueryTypes.SELECT,
      },
    );
    const theatreIds = new Map(theatres.map((theatre) => [theatre.name, theatre.id]));
    const moviesByTitle = new Map(movies.map((movie) => [movie.title, movie]));

    const shows = [];
    for (const theatre of THEATRES) {
      for (let day = -PAST_DAYS; day < FUTURE_DAYS; day++) {
        SHOW_SLOTS.forEach((slot, slotIndex) => {
          const title =
            theatre.movies[(day + PAST_DAYS + slotIndex) % theatre.movies.length];
          const movie = moviesByTitle.get(title);

          const startsAt = new Date();
          startsAt.setDate(startsAt.getDate() + day);
          startsAt.setHours(slot.hour, slot.minute, 0, 0);
          const endsAt = new Date(
            startsAt.getTime() +
              (movie.duration_minutes + BREAK_MINUTES) * 60 * 1000,
          );

          shows.push({
            movie_id: movie.id,
            theatre_id: theatreIds.get(theatre.name),
            starts_at: startsAt,
            ends_at: endsAt,
            price: theatre.price + slot.extraPrice,
          });
        });
      }
    }

    await queryInterface.bulkInsert("shows", shows);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      "DELETE FROM shows WHERE theatre_id IN (SELECT id FROM theatres WHERE name IN (:names))",
      { replacements: { names: THEATRES.map((theatre) => theatre.name) } },
    );
  },
};
