"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("booking_seats", {
      booking_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "bookings", key: "id" },
        onDelete: "CASCADE",
      },
      show_seat_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "show_seats", key: "id" },
      },
    });
    await queryInterface.addIndex("booking_seats", ["show_seat_id"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("booking_seats");
  },
};
