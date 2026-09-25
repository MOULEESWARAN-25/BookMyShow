const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { UniqueConstraintError } = require("sequelize");
const { User } = require("../models");
const redis = require("../db/redis");
const { redisLogger } = require("../utils/logger");
const {
  SESSION_TTL_SECONDS,
  createSession,
  deleteSession,
} = require("../utils/session");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const MAX_FAILED_LOGINS = 5;
const FAILED_LOGIN_WINDOW_SECONDS = 15 * 60;

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

  const failedLoginsKey = `failed_logins:${req.ip}:${email}`;
  const failedLogins = Number(await redis.get(failedLoginsKey));
  if (failedLogins >= MAX_FAILED_LOGINS) {
    const retryAfter = await redis.ttl(failedLoginsKey);
    redisLogger.warn(
      `Login blocked for ${email} from ${req.ip}: too many wrong passwords, unlocks in ${retryAfter}s`,
    );
    res.set("Retry-After", String(retryAfter));
    return res.status(429).json({
      message: `Too many failed login attempts. Try again in ${Math.ceil(retryAfter / 60)} minutes`,
    });
  }

  const user = await User.findOne({ where: { email } });
  const isCorrectPassword =
    user && (await bcrypt.compare(password, user.password));
  if (!user || !isCorrectPassword) {
    const [attempts] = await redis
      .multi()
      .incr(failedLoginsKey)
      .expire(failedLoginsKey, FAILED_LOGIN_WINDOW_SECONDS, "NX")
      .exec();
    redisLogger.warn(
      `Wrong password for ${email} from ${req.ip} (${attempts}/${MAX_FAILED_LOGINS})`,
    );
    return res.status(401).json({ message: "Invalid credentials" });
  }

  await redis.del(failedLoginsKey);

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: SESSION_TTL_SECONDS, jwtid: crypto.randomUUID() },
  );

  await createSession(user.id, token);

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
  await deleteSession(req.user.userId, req.token);

  res.status(200).json({ message: "Logged out successfully" });
};

module.exports = {
  signup,
  login,
  logout,
};
