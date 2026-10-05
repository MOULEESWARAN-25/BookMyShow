"use strict";

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      "ALTER TABLE users DROP CONSTRAINT users_role_check",
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin', 'super_admin'))",
    );
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      "ALTER TABLE users DROP CONSTRAINT users_role_check",
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'))",
    );
  },
};
