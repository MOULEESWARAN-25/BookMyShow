CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'))
);

CREATE TABLE IF NOT EXISTS movies (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  language TEXT NOT NULL,
  genre TEXT NOT NULL,
  duration TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shows (
  id SERIAL PRIMARY KEY,
  movie_id INTEGER NOT NULL REFERENCES movies(id),
  time TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS seats (
  id SERIAL PRIMARY KEY,
  show_id INTEGER NOT NULL REFERENCES shows(id),
  seat_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  UNIQUE (show_id, seat_number)
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  show_id INTEGER NOT NULL REFERENCES shows(id),
  seats TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'booked'
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
