const sequelize = require("../db/sequelize");
const User = require("./user");
const Movie = require("./movie");
const Show = require("./show");
const Seat = require("./seat");
const Booking = require("./booking");
const Session = require("./session");

Movie.hasMany(Show, { foreignKey: "movieId" });
Show.belongsTo(Movie, { foreignKey: "movieId" });

Show.hasMany(Seat, { foreignKey: "showId" });
Seat.belongsTo(Show, { foreignKey: "showId" });

Show.hasMany(Booking, { foreignKey: "showId" });
Booking.belongsTo(Show, { foreignKey: "showId" });

User.hasMany(Booking, { foreignKey: "userId" });
Booking.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Session, { foreignKey: "userId" });
Session.belongsTo(User, { foreignKey: "userId" });

module.exports = {
  sequelize,
  User,
  Movie,
  Show,
  Seat,
  Booking,
  Session,
};
