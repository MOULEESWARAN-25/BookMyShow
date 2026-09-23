const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const Booking = sequelize.define(
  "Booking",
  {
    userId: { type: DataTypes.INTEGER, allowNull: false, field: "user_id" },
    showId: { type: DataTypes.INTEGER, allowNull: false, field: "show_id" },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "total_amount",
      get() {
        const value = this.getDataValue("totalAmount");
        return value === null ? null : Number(value);
      },
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "confirmed",
      validate: { isIn: [["confirmed", "cancelled"]] },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
  },
  {
    tableName: "bookings",
    timestamps: false,
  },
);

module.exports = Booking;
