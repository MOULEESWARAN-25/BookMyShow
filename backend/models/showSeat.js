const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const ShowSeat = sequelize.define(
  "ShowSeat",
  {
    showId: { type: DataTypes.INTEGER, allowNull: false, field: "show_id" },
    seatNumber: { type: DataTypes.TEXT, allowNull: false, field: "seat_number" },
    status: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "available",
      validate: { isIn: [["available", "booked"]] },
    },
  },
  {
    tableName: "show_seats",
    timestamps: false,
  },
);

module.exports = ShowSeat;
