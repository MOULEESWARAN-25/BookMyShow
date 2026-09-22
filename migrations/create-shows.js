"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("shows", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      movie_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "movies", key: "id" },
      },
      time: { type: Sequelize.TEXT, allowNull: false },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("shows");
  },
};
