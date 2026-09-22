const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const Session = sequelize.define(
  "Session",
  {
    userId: { type: DataTypes.INTEGER, allowNull: false, field: "user_id" },
    token: { type: DataTypes.TEXT, allowNull: false, unique: true },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
    expiresAt: { type: DataTypes.DATE, allowNull: false, field: "expires_at" },
  },
  {
    tableName: "sessions",
    timestamps: false,
  },
);

module.exports = Session;
