"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { Op } = Sequelize;

    await queryInterface.createTable("reviews", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      // One review per booking, and it cannot be changed once sent.
      booking_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: "bookings", key: "id" },
      },
      movie_rating: { type: Sequelize.SMALLINT, allowNull: false },
      theatre_rating: { type: Sequelize.SMALLINT, allowNull: false },
      liked_aspects: {
        type: Sequelize.ARRAY(Sequelize.TEXT),
        allowNull: false,
        defaultValue: [],
      },
      comment: { type: Sequelize.TEXT, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("now"),
      },
    });
    await queryInterface.addConstraint("reviews", {
      fields: ["movie_rating"],
      type: "check",
      where: { movie_rating: { [Op.between]: [1, 5] } },
      name: "reviews_movie_rating_check",
    });
    await queryInterface.addConstraint("reviews", {
      fields: ["theatre_rating"],
      type: "check",
      where: { theatre_rating: { [Op.between]: [1, 5] } },
      name: "reviews_theatre_rating_check",
    });
    await queryInterface.sequelize.query(
      "ALTER TABLE reviews ADD CONSTRAINT reviews_comment_length_check CHECK (char_length(comment) <= 500)",
    );
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("reviews");
  },
};
