const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const BookingSeat = sequelize.define(
  "BookingSeat",
  {
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "booking_id",
    },
    showSeatId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "show_seat_id",
    },
  },
  {
    tableName: "booking_seats",
    timestamps: false,
  },
);

module.exports = BookingSeat;
