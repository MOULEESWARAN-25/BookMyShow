require("dotenv").config();
const bcrypt = require("bcrypt");
const { User } = require("../models");
const { logger } = require("../utils/logger");

const [name, rawEmail, password] = process.argv.slice(2);
const email = rawEmail?.trim().toLowerCase();

if (!name || !email || !password) {
  console.error("Usage: node db/createAdmin.js <name> <email> <password>");
  process.exit(1);
}

const createAdmin = async () => {
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

  const adminDetails = {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };
  logger.info(`Admin account created: ${JSON.stringify(adminDetails)}`);
};

createAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error(`Failed to create admin: ${error.message}`);
    process.exit(1);
  });
