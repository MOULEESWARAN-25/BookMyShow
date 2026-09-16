const bcrypt = require("bcrypt");

const users = [
  {
    id: 1,
    name: "Mouleeswaran",
    email: "moulee201@gmail.com",
    password: bcrypt.hashSync("12233456", 10),
    role: "user",
  },
  {
    id: 2,
    name: "Arun",
    email: "arun@gmail.com",
    password: bcrypt.hashSync("arun123", 10),
    role: "user",
  },
  {
    id: 3,
    name: "Admin",
    email: "admin@gmail.com",
    password: bcrypt.hashSync("admin123", 10),
    role: "admin",
  },
];

const bookings = [
  {
    id: 1,
    userId: 1,
    showId: 101,
    seats: ["A1", "A2"],
    status: "confirmed",
  },
  {
    id: 2,
    userId: 2,
    showId: 102,
    seats: ["B1", "B2"],
    status: "confirmed",
  },
];

const movies = [
  {
    id: 1,
    title: "Coolie",
    language: "Tamil",
    genre: "Action",
    duration: "2h 45m",

    shows: [
      {
        id: 101,
        time: "10:00 AM",
        seats: [
          { seatNumber: "A1", status: "booked" },
          { seatNumber: "A2", status: "booked" },
          { seatNumber: "A3", status: "booked" },
          { seatNumber: "A4", status: "available" },
          { seatNumber: "A5", status: "available" },

          { seatNumber: "B1", status: "available" },
          { seatNumber: "B2", status: "available" },
          { seatNumber: "B3", status: "available" },
          { seatNumber: "B4", status: "available" },
          { seatNumber: "B5", status: "booked" },
        ],
      },

      {
        id: 102,
        time: "2:00 PM",
        seats: [
          { seatNumber: "A1", status: "available" },
          { seatNumber: "A2", status: "available" },
          { seatNumber: "A3", status: "available" },
          { seatNumber: "A4", status: "available" },
          { seatNumber: "A5", status: "booked" },

          { seatNumber: "B1", status: "booked" },
          { seatNumber: "B2", status: "booked" },
          { seatNumber: "B3", status: "available" },
          { seatNumber: "B4", status: "available" },
          { seatNumber: "B5", status: "available" },
        ],
      },
    ],
  },

  {
    id: 2,
    title: "Dragon",
    language: "Tamil",
    genre: "Comedy",
    duration: "2h 30m",

    shows: [
      {
        id: 201,
        time: "11:00 AM",
        seats: [
          { seatNumber: "A1", status: "available" },
          { seatNumber: "A2", status: "available" },
          { seatNumber: "A3", status: "booked" },
          { seatNumber: "A4", status: "available" },
          { seatNumber: "A5", status: "available" },

          { seatNumber: "B1", status: "booked" },
          { seatNumber: "B2", status: "available" },
          { seatNumber: "B3", status: "available" },
          { seatNumber: "B4", status: "booked" },
          { seatNumber: "B5", status: "available" },
        ],
      },
    ],
  },

  {
    id: 3,
    title: "Retro",
    language: "Tamil",
    genre: "Romance",
    duration: "2h 40m",

    shows: [
      {
        id: 301,
        time: "4:00 PM",
        seats: [
          { seatNumber: "A1", status: "available" },
          { seatNumber: "A2", status: "booked" },
          { seatNumber: "A3", status: "available" },
          { seatNumber: "A4", status: "available" },
          { seatNumber: "A5", status: "booked" },

          { seatNumber: "B1", status: "available" },
          { seatNumber: "B2", status: "available" },
          { seatNumber: "B3", status: "booked" },
          { seatNumber: "B4", status: "available" },
          { seatNumber: "B5", status: "available" },
        ],
      },
    ],
  },
];

module.exports = {
  users,
  bookings,
  movies,
};
