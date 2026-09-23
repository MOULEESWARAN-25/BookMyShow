const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op, UniqueConstraintError } = require("sequelize");
const { User, Session } = require("../models");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const MAX_ACTIVE_SESSIONS = 3;

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const signup = async (req, res) => {
  const { name, password } = req.body || {};
  const email = normalizeEmail(req.body?.email);

  if (
    typeof name !== "string" ||
    !name.trim() ||
    !email ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      message: "All the fields are required: name, email, and password",
    });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res
      .status(400)
      .json({ message: "Please provide a valid email address" });
  }

  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters long and contain at least one letter and one number",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await User.create({
      name: name.trim(),
      email,
      password: hashedPassword,
      role: "user",
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({ message: "User already exists" });
    }
    throw error;
  }

  res.status(201).json({ message: "User created successfully" });
};

const login = async (req, res) => {
  const { password } = req.body || {};
  const email = normalizeEmail(req.body?.email);

  if (!email || typeof password !== "string" || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ where: { email } });
  const isCorrectPassword =
    user && (await bcrypt.compare(password, user.password));
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

  const activeSessions = await Session.findAll({
    where: { userId: user.id, expiresAt: { [Op.gt]: new Date() } },
    order: [["createdAt", "ASC"]],
  });
  if (activeSessions.length >= MAX_ACTIVE_SESSIONS) {
    const sessionsToEvict = activeSessions.slice(
      0,
      activeSessions.length - MAX_ACTIVE_SESSIONS + 1,
    );
    await Session.destroy({
      where: { id: sessionsToEvict.map((session) => session.id) },
    });
  }

  await Session.create({ userId: user.id, token, expiresAt });

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
  await Session.destroy({ where: { token: req.token } });

  res.status(200).json({ message: "Logged out successfully" });
};

module.exports = {
  signup,
  login,
  logout,
};
