"use strict";

const bcrypt = require("bcrypt");
const { PASSWORD, ADMINS, USERS } = require("../db/seedData");

const DAY_MS = 24 * 60 * 60 * 1000;

module.exports = {
  up: async (queryInterface) => {
    const password = await bcrypt.hash(PASSWORD, 10);
    const now = Date.now();

    await queryInterface.bulkInsert("users", [
      ...ADMINS.map(({ name, email }) => ({
        name,
        email,
        password,
        role: "admin",
        created_at: new Date(now - 60 * DAY_MS),
      })),
      ...USERS.map(({ name, email }, index) => ({
        name,
        email,
        password,
        role: "user",
        created_at: new Date(now - (45 - index * 2) * DAY_MS),
      })),
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("users", {
      email: [...ADMINS, ...USERS].map((user) => user.email),
    });
  },
};
