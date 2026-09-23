"use strict";

const { THEATRES, SEAT_ROWS, SEATS_PER_ROW } = require("../db/seedData");

const SEEDED_SHOWS_SQL =
  "SELECT s.id FROM shows s JOIN theatres t ON t.id = s.theatre_id WHERE t.name IN (:names)";

module.exports = {
  up: async (queryInterface) => {
    const shows = await queryInterface.sequelize.query(SEEDED_SHOWS_SQL, {
      replacements: { names: THEATRES.map((theatre) => theatre.name) },
      type: queryInterface.sequelize.QueryTypes.SELECT,
    });

    const seats = shows.flatMap((show) =>
      SEAT_ROWS.flatMap((row) =>
        Array.from({ length: SEATS_PER_ROW }, (_, index) => ({
          show_id: show.id,
          seat_number: `${row}${index + 1}`,
          status: "available",
        })),
      ),
    );

    await queryInterface.bulkInsert("show_seats", seats);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      `DELETE FROM show_seats WHERE show_id IN (${SEEDED_SHOWS_SQL})`,
      { replacements: { names: THEATRES.map((theatre) => theatre.name) } },
    );
  },
};
