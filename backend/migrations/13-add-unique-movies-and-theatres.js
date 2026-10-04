"use strict";

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX movies_title_language_release_date_key
         ON movies (lower(title), lower(language), release_date) NULLS NOT DISTINCT`,
    );
    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX theatres_admin_id_name_key
         ON theatres (admin_id, lower(name))`,
    );
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query("DROP INDEX theatres_admin_id_name_key");
    await queryInterface.sequelize.query("DROP INDEX movies_title_language_release_date_key");
  },
};
