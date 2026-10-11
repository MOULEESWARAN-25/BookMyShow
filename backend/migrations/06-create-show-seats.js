"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("show_seats", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      show_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "shows", key: "id" },
        onDelete: "CASCADE",
      },
      seat_number: { type: Sequelize.TEXT, allowNull: false },
      status: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "available",
      },
    });
    await queryInterface.addConstraint("show_seats", {
      fields: ["show_id", "seat_number"],
      type: "unique",
      name: "show_seats_show_id_seat_number_key",
    });
    await queryInterface.addConstraint("show_seats", {
      fields: ["status"],
      type: "check",
      where: { status: ["available", "booked"] },
      name: "show_seats_status_check",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("show_seats");
  },
};
