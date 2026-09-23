const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const User = sequelize.define(
  "User",
  {
    name: { type: DataTypes.TEXT, allowNull: false },
    email: { type: DataTypes.TEXT, allowNull: false, unique: true },
    password: { type: DataTypes.TEXT, allowNull: false },
    role: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "user",
      validate: { isIn: [["user", "admin"]] },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
  },
  {
    tableName: "users",
    timestamps: false,
  },
);

module.exports = User;
