"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("shows", "reminder_queued_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addIndex("shows", ["starts_at"], {
      name: "shows_starts_at_reminder_pending_idx",
      where: { reminder_queued_at: null },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex("shows", "shows_starts_at_reminder_pending_idx");
    await queryInterface.removeColumn("shows", "reminder_queued_at");
  },
};
