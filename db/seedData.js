const PASSWORD = "Passw0rd1";

const ADMINS = [
  { name: "Arjun Kumar", email: "arjun.admin@example.com" },
  { name: "Priya Raman", email: "priya.admin@example.com" },
  { name: "Karthik Rao", email: "karthik.admin@example.com" },
];

const USERS = [
  { name: "Ravi Shankar", email: "ravi@example.com" },
  { name: "Divya Menon", email: "divya@example.com" },
  { name: "Suresh Babu", email: "suresh@example.com" },
  { name: "Anjali Nair", email: "anjali@example.com" },
  { name: "Vignesh Pandian", email: "vignesh@example.com" },
  { name: "Meera Krishnan", email: "meera@example.com" },
  { name: "Rahul Verma", email: "rahul@example.com" },
  { name: "Sneha Reddy", email: "sneha@example.com" },
  { name: "Aravind Swamy", email: "aravind@example.com" },
  { name: "Lakshmi Iyer", email: "lakshmi@example.com" },
  { name: "Manoj Kumar", email: "manoj@example.com" },
  { name: "Kavya Suresh", email: "kavya@example.com" },
  { name: "Harish Gowda", email: "harish@example.com" },
  { name: "Nithya Das", email: "nithya@example.com" },
  { name: "Sanjay Patel", email: "sanjay@example.com" },
];

const MOVIES = [
  {
    title: "Leo",
    description: "A café owner's quiet life unravels when his past catches up with him.",
    language: "Tamil",
    genre: "Action",
    durationMinutes: 164,
    releaseDate: "2023-10-19",
    castMembers: ["Vijay", "Trisha", "Sanjay Dutt"],
    popularity: 0.9,
  },
  {
    title: "Jailer",
    description: "A retired jailer goes after the gang that threatens his family.",
    language: "Tamil",
    genre: "Action",
    durationMinutes: 168,
    releaseDate: "2023-08-10",
    castMembers: ["Rajinikanth", "Ramya Krishnan", "Vinayakan"],
    popularity: 0.85,
  },
  {
    title: "Amaran",
    description: "The life of an Indian Army officer and the family he leaves at home.",
    language: "Tamil",
    genre: "Drama",
    durationMinutes: 169,
    releaseDate: "2024-10-31",
    castMembers: ["Sivakarthikeyan", "Sai Pallavi"],
    popularity: 0.75,
  },
  {
    title: "Manjummel Boys",
    description: "A group of friends on a trip must rescue one of them from a deep cave.",
    language: "Malayalam",
    genre: "Thriller",
    durationMinutes: 135,
    releaseDate: "2024-02-22",
    castMembers: ["Soubin Shahir", "Sreenath Bhasi"],
    popularity: 0.6,
  },
  {
    title: "Jawan",
    description: "A man sets out to fix the wrongs in society, one heist at a time.",
    language: "Hindi",
    genre: "Action",
    durationMinutes: 169,
    releaseDate: "2023-09-07",
    castMembers: ["Shah Rukh Khan", "Nayanthara", "Vijay Sethupathi"],
    popularity: 0.7,
  },
  {
    title: "Stree 2",
    description: "A small town faces a new supernatural threat.",
    language: "Hindi",
    genre: "Horror Comedy",
    durationMinutes: 147,
    releaseDate: "2024-08-15",
    castMembers: ["Rajkummar Rao", "Shraddha Kapoor"],
    popularity: 0.55,
  },
  {
    title: "Kalki 2898 AD",
    description: "A mythological sci-fi epic set in a dystopian future.",
    language: "Telugu",
    genre: "Sci-Fi",
    durationMinutes: 181,
    releaseDate: "2024-06-27",
    castMembers: ["Prabhas", "Deepika Padukone", "Amitabh Bachchan"],
    popularity: 0.5,
  },
  {
    title: "Premalu",
    description: "A light-hearted romance between two young people in Hyderabad.",
    language: "Malayalam",
    genre: "Romance",
    durationMinutes: 156,
    releaseDate: "2024-02-09",
    castMembers: ["Naslen", "Mamitha Baiju"],
    popularity: 0.3,
  },
];

const THEATRES = [
  {
    name: "Star Cinemas",
    city: "Chennai",
    adminEmail: "arjun.admin@example.com",
    price: 180,
    movies: ["Leo", "Jailer", "Amaran"],
  },
  {
    name: "Royal Theatre",
    city: "Chennai",
    adminEmail: "arjun.admin@example.com",
    price: 150,
    movies: ["Leo", "Manjummel Boys", "Premalu"],
  },
  {
    name: "Galaxy Multiplex",
    city: "Bengaluru",
    adminEmail: "priya.admin@example.com",
    price: 250,
    movies: ["Jawan", "Kalki 2898 AD", "Stree 2"],
  },
  {
    name: "Lakeview Cinemas",
    city: "Bengaluru",
    adminEmail: "priya.admin@example.com",
    price: 200,
    movies: ["Jailer", "Jawan", "Manjummel Boys"],
  },
  {
    name: "Kovai Talkies",
    city: "Coimbatore",
    adminEmail: "karthik.admin@example.com",
    price: 120,
    movies: ["Amaran", "Leo", "Premalu"],
  },
];

const SHOW_SLOTS = [
  { hour: 10, minute: 0, extraPrice: 0, demand: 0.6 },
  { hour: 14, minute: 30, extraPrice: 0, demand: 0.8 },
  { hour: 19, minute: 0, extraPrice: 50, demand: 1.2 },
];

const PAST_DAYS = 14;
const FUTURE_DAYS = 7;
const SEAT_ROWS = ["A", "B", "C", "D", "E"];
const SEATS_PER_ROW = 10;

module.exports = {
  PASSWORD,
  ADMINS,
  USERS,
  MOVIES,
  THEATRES,
  SHOW_SLOTS,
  PAST_DAYS,
  FUTURE_DAYS,
  SEAT_ROWS,
  SEATS_PER_ROW,
};
