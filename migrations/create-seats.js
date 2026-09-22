"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("seats", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      show_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "shows", key: "id" },
      },
      seat_number: { type: Sequelize.TEXT, allowNull: false },
      status: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "available",
      },
    });

    await queryInterface.addConstraint("seats", {
      fields: ["show_id", "seat_number"],
      type: "unique",
      name: "seats_show_id_seat_number_key",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("seats");
  },
};
