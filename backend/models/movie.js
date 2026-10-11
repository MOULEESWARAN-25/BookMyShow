const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const Movie = sequelize.define(
  "Movie",
  {
    title: { type: DataTypes.TEXT, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    language: { type: DataTypes.TEXT, allowNull: false },
    genre: { type: DataTypes.TEXT, allowNull: false },
    durationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "duration_minutes",
      validate: { min: 1 },
    },
    releaseDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "release_date",
    },
    castMembers: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
      field: "cast_members",
    },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: "created_by" },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
  },
  {
    tableName: "movies",
    timestamps: false,
  },
);

module.exports = Movie;
