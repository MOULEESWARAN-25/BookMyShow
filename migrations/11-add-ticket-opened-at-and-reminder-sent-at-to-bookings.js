"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("bookings", "ticket_opened_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("bookings", "reminder_sent_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("bookings", "reminder_sent_at");
    await queryInterface.removeColumn("bookings", "ticket_opened_at");
  },
};
