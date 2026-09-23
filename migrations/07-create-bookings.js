"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { Op } = Sequelize;

    await queryInterface.createTable("bookings", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
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
      total_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      status: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "confirmed",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("now"),
      },
    });
    await queryInterface.addConstraint("bookings", {
      fields: ["status"],
      type: "check",
      where: { status: ["confirmed", "cancelled"] },
      name: "bookings_status_check",
    });
    await queryInterface.addConstraint("bookings", {
      fields: ["total_amount"],
      type: "check",
      where: { total_amount: { [Op.gte]: 0 } },
      name: "bookings_total_amount_check",
    });
    await queryInterface.addIndex("bookings", ["user_id"]);
    await queryInterface.addIndex("bookings", ["show_id"]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("bookings");
  },
};
