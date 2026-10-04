"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { Op } = Sequelize;

    await queryInterface.createTable("movies", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: Sequelize.TEXT, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      language: { type: Sequelize.TEXT, allowNull: false },
      genre: { type: Sequelize.TEXT, allowNull: false },
      duration_minutes: { type: Sequelize.INTEGER, allowNull: false },
      release_date: { type: Sequelize.DATEONLY, allowNull: true },
      cast_members: { type: Sequelize.ARRAY(Sequelize.TEXT), allowNull: true },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("now"),
      },
    });
    await queryInterface.addConstraint("movies", {
      fields: ["duration_minutes"],
      type: "check",
      where: { duration_minutes: { [Op.gt]: 0 } },
      name: "movies_duration_minutes_check",
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("movies");
  },
};
