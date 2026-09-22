const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const Booking = sequelize.define(
  "Booking",
  {
    userId: { type: DataTypes.INTEGER, allowNull: false, field: "user_id" },
    showId: { type: DataTypes.INTEGER, allowNull: false, field: "show_id" },
    seats: { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: false },
    status: { type: DataTypes.TEXT, allowNull: false, defaultValue: "booked" },
  },
  {
    tableName: "bookings",
    timestamps: false,
  },
);

module.exports = Booking;
