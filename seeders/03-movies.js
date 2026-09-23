"use strict";

const { ADMINS, MOVIES } = require("../db/seedData");

module.exports = {
  up: async (queryInterface) => {
    const [admin] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = :email",
      {
        replacements: { email: ADMINS[0].email },
        type: queryInterface.sequelize.QueryTypes.SELECT,
      },
    );

    await queryInterface.bulkInsert(
      "movies",
      MOVIES.map((movie) => ({
        title: movie.title,
        description: movie.description,
        language: movie.language,
        genre: movie.genre,
        duration_minutes: movie.durationMinutes,
        release_date: movie.releaseDate,
        cast_members: movie.castMembers,
        created_by: admin.id,
      })),
    );
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("movies", {
      title: MOVIES.map((movie) => movie.title),
    });
  },
};
