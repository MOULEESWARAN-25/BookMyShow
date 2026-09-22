require("dotenv").config();
const bcrypt = require("bcrypt");
const { sequelize, User } = require("../models");

const [name, email, password] = process.argv.slice(2);

if (!name || !email || !password) {
  console.error("Usage: node db/createAdmin.js <name> <email> <password>");
  process.exit(1);
}

const createAdmin = async () => {
  await sequelize.sync();

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new Error(`A user with email ${email} already exists`);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "admin",
  });

  console.log("Admin account created:", {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  });
};

createAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to create admin:", error.message);
    process.exit(1);
  });
