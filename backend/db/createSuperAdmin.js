require("dotenv").config();
const bcrypt = require("bcrypt");
const { User } = require("../models");
const { logger } = require("../utils/logger");

const [name, rawEmail, password] = process.argv.slice(2);
const email = rawEmail?.trim().toLowerCase();

if (!name || !email || !password) {
  console.error(
    "Usage: npm run create-super-admin -- <name> <email> <password>",
  );
  process.exit(1);
}

const createSuperAdmin = async () => {
  const existingSuperAdmin = await User.findOne({
    where: { role: "super_admin" },
    attributes: ["email"],
  });
  if (existingSuperAdmin) {
    throw new Error(
      `A super admin already exists (${existingSuperAdmin.email}). Only one super admin is allowed`,
    );
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new Error(`A user with email ${email} already exists`);
  }

  const admin = await User.create({
    name: name.trim(),
    email,
    password: await bcrypt.hash(password, 10),
    role: "super_admin",
  });

  logger.info(`Super admin account created: ${admin.email}`);
};

createSuperAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error(`Failed to create super admin: ${error.message}`);
    process.exit(1);
  });
