const { DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize");

const Review = sequelize.define(
  "Review",
  {
    bookingId: { type: DataTypes.INTEGER, allowNull: false, field: "booking_id" },
    movieRating: { type: DataTypes.SMALLINT, allowNull: false, field: "movie_rating" },
    theatreRating: { type: DataTypes.SMALLINT, allowNull: false, field: "theatre_rating" },
    likedAspects: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: false,
      defaultValue: [],
      field: "liked_aspects",
    },
    comment: { type: DataTypes.TEXT, allowNull: true },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
  },
  {
    tableName: "reviews",
    timestamps: false,
  },
);

module.exports = Review;
