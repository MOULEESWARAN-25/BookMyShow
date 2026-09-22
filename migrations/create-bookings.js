"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("bookings", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      show_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "shows", key: "id" },
      },
      seats: { type: Sequelize.ARRAY(Sequelize.TEXT), allowNull: false },
      status: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "booked",
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("bookings");
  },
};
