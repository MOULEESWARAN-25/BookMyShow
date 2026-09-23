"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { Op } = Sequelize;

    await queryInterface.createTable("shows", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      movie_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "movies", key: "id" },
      },
      theatre_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "theatres", key: "id" },
      },
      starts_at: { type: Sequelize.DATE, allowNull: false },
      ends_at: { type: Sequelize.DATE, allowNull: false },
      price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
    });
    await queryInterface.addConstraint("shows", {
      fields: ["price"],
      type: "check",
      where: { price: { [Op.gte]: 0 } },
      name: "shows_price_check",
    });
    await queryInterface.addIndex("shows", ["movie_id", "starts_at"]);

    // A theatre has a single hall, so two of its shows must never overlap in time.
    await queryInterface.sequelize.query(
      "CREATE EXTENSION IF NOT EXISTS btree_gist",
    );
    await queryInterface.sequelize.query(`
      ALTER TABLE "shows"
        ADD CONSTRAINT shows_time_range_check CHECK (ends_at > starts_at),
        ADD CONSTRAINT shows_no_overlap EXCLUDE USING gist (
          theatre_id WITH =,
          tstzrange(starts_at, ends_at) WITH &&
        )
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("shows");
  },
};
