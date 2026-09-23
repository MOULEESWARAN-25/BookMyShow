const sequelize = require("../db/sequelize");
const User = require("./user");
const Session = require("./session");
const Theatre = require("./theatre");
const Movie = require("./movie");
const Show = require("./show");
const ShowSeat = require("./showSeat");
const Booking = require("./booking");
const BookingSeat = require("./bookingSeat");

User.hasMany(Session, { foreignKey: "userId" });
Session.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Theatre, { foreignKey: "adminId", as: "theatres" });
Theatre.belongsTo(User, { foreignKey: "adminId", as: "admin" });

User.hasMany(Movie, { foreignKey: "createdBy", as: "createdMovies" });
Movie.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

Movie.hasMany(Show, { foreignKey: "movieId" });
Show.belongsTo(Movie, { foreignKey: "movieId" });

Theatre.hasMany(Show, { foreignKey: "theatreId" });
Show.belongsTo(Theatre, { foreignKey: "theatreId", as: "theatre" });

Show.hasMany(ShowSeat, { foreignKey: "showId", as: "seats" });
ShowSeat.belongsTo(Show, { foreignKey: "showId" });

User.hasMany(Booking, { foreignKey: "userId" });
Booking.belongsTo(User, { foreignKey: "userId" });

Show.hasMany(Booking, { foreignKey: "showId" });
Booking.belongsTo(Show, { foreignKey: "showId" });

Booking.belongsToMany(ShowSeat, {
  through: BookingSeat,
  foreignKey: "bookingId",
  otherKey: "showSeatId",
  as: "seats",
});
ShowSeat.belongsToMany(Booking, {
  through: BookingSeat,
  foreignKey: "showSeatId",
  otherKey: "bookingId",
});

module.exports = {
  sequelize,
  User,
  Session,
  Theatre,
  Movie,
  Show,
  ShowSeat,
  Booking,
  BookingSeat,
};
