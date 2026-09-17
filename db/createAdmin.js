require("dotenv").config();
const bcrypt = require("bcrypt");
const pool = require("./pool");

const [name, email, password] = process.argv.slice(2);

if (!name || !email || !password) {
  console.error("Usage: node db/createAdmin.js <name> <email> <password>");
  process.exit(1);
}

const createAdmin = async () => {
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    throw new Error(`A user with email ${email} already exists`);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'admin') RETURNING id, name, email, role",
    [name, email, hashedPassword],
  );

  console.log("Admin account created:", result.rows[0]);
};

createAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to create admin:", error.message);
    process.exit(1);
  });
