const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const Theatre = sequelize.define(
  "Theatre",
  {
    adminId: { type: DataTypes.INTEGER, allowNull: false, field: "admin_id" },
    name: { type: DataTypes.TEXT, allowNull: false },
    city: { type: DataTypes.TEXT, allowNull: false },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
  },
  {
    tableName: "theatres",
    timestamps: false,
  },
);

module.exports = Theatre;
