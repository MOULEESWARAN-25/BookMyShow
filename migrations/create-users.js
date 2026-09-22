"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: { type: Sequelize.TEXT, allowNull: false },
      email: { type: Sequelize.TEXT, allowNull: false, unique: true },
      password: { type: Sequelize.TEXT, allowNull: false },
      role: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "user",
      },
    });

    await queryInterface.sequelize.query(
      'ALTER TABLE "users" ADD CONSTRAINT users_role_check CHECK (role IN (\'user\', \'admin\'))',
    );
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("users");
  },
};
