"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("theatres", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      admin_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      name: { type: Sequelize.TEXT, allowNull: false },
      city: { type: Sequelize.TEXT, allowNull: false },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("now"),
      },
    });
    await queryInterface.addIndex("theatres", ["admin_id"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("theatres");
  },
};
