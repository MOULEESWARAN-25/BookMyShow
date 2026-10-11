"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("users", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.TEXT, allowNull: false },
      email: { type: Sequelize.TEXT, allowNull: false, unique: true },
      password: { type: Sequelize.TEXT, allowNull: false },
      role: { type: Sequelize.TEXT, allowNull: false, defaultValue: "user" },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("now"),
      },
    });
    await queryInterface.addConstraint("users", {
      fields: ["role"],
      type: "check",
      where: { role: ["user", "admin"] },
      name: "users_role_check",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("users");
  },
};
