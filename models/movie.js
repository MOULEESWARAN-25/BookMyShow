const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const Movie = sequelize.define(
  "Movie",
  {
    title: { type: DataTypes.TEXT, allowNull: false },
    language: { type: DataTypes.TEXT, allowNull: false },
    genre: { type: DataTypes.TEXT, allowNull: false },
    duration: { type: DataTypes.TEXT, allowNull: false },
  },
  {
    tableName: "movies",
    timestamps: false,
  },
);

module.exports = Movie;
