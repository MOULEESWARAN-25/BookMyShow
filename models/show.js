const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const Show = sequelize.define(
  "Show",
  {
    movieId: { type: DataTypes.INTEGER, allowNull: false, field: "movie_id" },
    theatreId: { type: DataTypes.INTEGER, allowNull: false, field: "theatre_id" },
    startsAt: { type: DataTypes.DATE, allowNull: false, field: "starts_at" },
    endsAt: { type: DataTypes.DATE, allowNull: false, field: "ends_at" },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
      get() {
        const value = this.getDataValue("price");
        return value === null ? null : Number(value);
      },
    },
  },
  {
    tableName: "shows",
    timestamps: false,
  },
);

module.exports = Show;
