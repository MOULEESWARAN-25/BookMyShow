"use strict";

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      "CREATE UNIQUE INDEX users_single_super_admin_idx ON users (role) WHERE role = 'super_admin'",
    );
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      "DROP INDEX IF EXISTS users_single_super_admin_idx",
    );
  },
};
