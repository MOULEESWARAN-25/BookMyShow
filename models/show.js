const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const Show = sequelize.define(
  "Show",
  {
    movieId: { type: DataTypes.INTEGER, allowNull: false, field: "movie_id" },
    time: { type: DataTypes.TEXT, allowNull: false },
  },
  {
    tableName: "shows",
    timestamps: false,
  },
);

module.exports = Show;
