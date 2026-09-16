const { users } = require("../data/store");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const signup = async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All the fields are required: name, email, and password",
    });
  }

  const existingUser = users.find((user) => user.email === email);
  if (existingUser) {
    return res.status(409).json({ message: "User already exists" });
  }

  const newUser = {
    id: users.length + 1,
    name,
    email,
    password: await bcrypt.hash(password, 10),
    role: "user",
  };
  users.push(newUser);
  res.status(201).json({ message: "User created successfully" });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  const user = users.find((it) => it.email === email);
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

module.exports = {
  signup,
  login,
};
