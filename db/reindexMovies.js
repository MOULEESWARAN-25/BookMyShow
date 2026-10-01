require("dotenv").config();
const { sequelize } = require("../models");
const { reindexAllMovies } = require("../utils/movieSearch");
const { logger } = require("../utils/logger");

reindexAllMovies()
  .then(async (count) => {
    logger.info(`Reindexed ${count} movie(s) into OpenSearch`);
    console.log(`Reindexed ${count} movie(s) into OpenSearch`);
    await sequelize.close();
  })
  .catch(async (error) => {
    logger.error(`Reindexing movies failed: ${error.message}`);
    console.error(`Reindexing movies failed: ${error.message}`);
    await sequelize.close();
    process.exit(1);
  });
