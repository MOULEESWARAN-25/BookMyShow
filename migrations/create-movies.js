"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("movies", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: { type: Sequelize.TEXT, allowNull: false },
      language: { type: Sequelize.TEXT, allowNull: false },
      genre: { type: Sequelize.TEXT, allowNull: false },
      duration: { type: Sequelize.TEXT, allowNull: false },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("movies");
  },
};
