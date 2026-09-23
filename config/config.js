require("dotenv").config();

const common = {
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  dialect: "postgres",
  seederStorage: "sequelize",
};

module.exports = {
  development: common,
  test: common,
  production: common,
};
