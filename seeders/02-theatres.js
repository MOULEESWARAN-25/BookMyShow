"use strict";

const { THEATRES } = require("../db/seedData");

module.exports = {
  up: async (queryInterface) => {
    const admins = await queryInterface.sequelize.query(
      "SELECT id, email FROM users WHERE email IN (:emails)",
      {
        replacements: { emails: THEATRES.map((theatre) => theatre.adminEmail) },
        type: queryInterface.sequelize.QueryTypes.SELECT,
      },
    );
    const adminIds = new Map(admins.map((admin) => [admin.email, admin.id]));

    await queryInterface.bulkInsert(
      "theatres",
      THEATRES.map((theatre) => ({
        admin_id: adminIds.get(theatre.adminEmail),
        name: theatre.name,
        city: theatre.city,
      })),
    );
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("theatres", {
      name: THEATRES.map((theatre) => theatre.name),
    });
  },
};
