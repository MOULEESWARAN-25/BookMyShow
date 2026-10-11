require("dotenv").config();
const { sequelize } = require("../models");
const { reindexAllMovies } = require("../utils/movieSearch");
const { logger } = require("../utils/logger");

reindexAllMovies()
  .then(async ({ indexed, removed }) => {
    const summary = `Reindexed ${indexed} movie(s) into OpenSearch, removed ${removed} that no longer exist`;
    logger.info(summary);
    console.log(summary);
    await sequelize.close();
  })
  .catch(async (error) => {
    logger.error(`Reindexing movies failed: ${error.message}`);
    console.error(`Reindexing movies failed: ${error.message}`);
    await sequelize.close();
    process.exit(1);
  });
