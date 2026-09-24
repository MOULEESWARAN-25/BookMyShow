"use strict";

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.dropTable("sessions");
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("sessions", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      token: { type: Sequelize.TEXT, allowNull: false, unique: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("now"),
      },
      expires_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
};
