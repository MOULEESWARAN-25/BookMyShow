const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const Seat = sequelize.define(
  "Seat",
  {
    showId: { type: DataTypes.INTEGER, allowNull: false, field: "show_id" },
    seatNumber: { type: DataTypes.TEXT, allowNull: false, field: "seat_number" },
    status: { type: DataTypes.TEXT, allowNull: false, defaultValue: "available" },
  },
  {
    tableName: "seats",
    timestamps: false,
    indexes: [{ unique: true, fields: ["show_id", "seat_number"] }],
  },
);

module.exports = Seat;
