const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db/pool");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const MAX_ACTIVE_SESSIONS = 3;

const signup = async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All the fields are required: name, email, and password",
    });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: "Please provide a valid email address" });
  }

  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long and contain at least one letter and one number",
    });
  }

  const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existingUser.rows.length > 0) {
    return res.status(409).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.query(
    "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'user')",
    [name, email, hashedPassword],
  );

  res.status(201).json({ message: "User created successfully" });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];
  const isCorrectPassword = user && (await bcrypt.compare(password, user.password));
  if (!user || !isCorrectPassword) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30m" },
  );
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  const activeSessions = await pool.query(
    "SELECT id FROM sessions WHERE user_id = $1 AND expires_at > now() ORDER BY created_at ASC",
    [user.id],
  );
  if (activeSessions.rows.length >= MAX_ACTIVE_SESSIONS) {
    const sessionsToEvict = activeSessions.rows.slice(
      0,
      activeSessions.rows.length - MAX_ACTIVE_SESSIONS + 1,
    );
    await pool.query(
      "DELETE FROM sessions WHERE id = ANY($1)",
      [sessionsToEvict.map((session) => session.id)],
    );
  }

  await pool.query(
    "INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)",
    [user.id, token, expiresAt],
  );

  res.status(200).json({
    message: "Login successful",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  });
};

const logout = async (req, res) => {
  await pool.query("DELETE FROM sessions WHERE token = $1", [req.token]);

  res.status(200).json({ message: "Logged out successfully" });
};

module.exports = {
  signup,
  login,
  logout,
};
