"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("shows", "cancelled_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.sequelize.query(`
      ALTER TABLE "shows"
        DROP CONSTRAINT shows_no_overlap,
        ADD CONSTRAINT shows_no_overlap EXCLUDE USING gist (
          theatre_id WITH =,
          tstzrange(starts_at, ends_at) WITH &&
        ) WHERE (cancelled_at IS NULL)
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "shows"
        DROP CONSTRAINT shows_no_overlap,
        ADD CONSTRAINT shows_no_overlap EXCLUDE USING gist (
          theatre_id WITH =,
          tstzrange(starts_at, ends_at) WITH &&
        )
    `);
    await queryInterface.removeColumn("shows", "cancelled_at");
  },
};
