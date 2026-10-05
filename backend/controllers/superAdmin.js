const bcrypt = require("bcrypt");
const { UniqueConstraintError } = require("sequelize");
const { sequelize, User, Theatre, Movie } = require("../models");
const { deleteAllSessions } = require("../utils/session");
const {
  parseId,
  isNonEmptyString,
  EMAIL_REGEX,
  PASSWORD_REGEX,
  PASSWORD_RULE,
  normalizeEmail,
} = require("../utils/validation");

// On edit the password is optional: leaving it empty keeps the current one.
const parseAdminFields = (body, { passwordRequired }) => {
  const { name, password } = body || {};
  const email = normalizeEmail(body?.email);

  if (!isNonEmptyString(name)) {
    return { error: "Name is required" };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { error: "Please provide a valid email address" };
  }
  const hasPassword = typeof password === "string" && password !== "";
  if ((passwordRequired || hasPassword) && !PASSWORD_REGEX.test(password ?? "")) {
    return { error: PASSWORD_RULE };
  }
  return { name: name.trim(), email, password: hasPassword ? password : null };
};

const duplicateEmail = (res) =>
  res.status(409).json({ message: "An account with this email already exists" });

const adminJson = (admin) => ({
  id: admin.id,
  name: admin.name,
  email: admin.email,
  createdAt: admin.createdAt,
});

const findAdmin = async (req, res) => {
  const adminId = parseId(req.params.adminId);
  if (!adminId) {
    res.status(400).json({ message: "adminId must be a positive integer" });
    return null;
  }
  const admin = await User.findOne({ where: { id: adminId, role: "admin" } });
  if (!admin) {
    res.status(404).json({ message: "Admin not found" });
    return null;
  }
  return admin;
};

const listAdmins = async (req, res) => {
  const admins = await sequelize.query(
    `SELECT u.id, u.name, u.email, u.created_at AS "createdAt",
            (SELECT count(*) FROM theatres t WHERE t.admin_id = u.id)::int AS theatres,
            (SELECT count(*) FROM movies m WHERE m.created_by = u.id)::int AS movies
       FROM users u
      WHERE u.role = 'admin'
      ORDER BY u.name`,
    { type: "SELECT" },
  );
  res.status(200).json({ admins });
};

const createAdmin = async (req, res) => {
  const fields = parseAdminFields(req.body, { passwordRequired: true });
  if (fields.error) {
    return res.status(400).json({ message: fields.error });
  }

  let admin;
  try {
    admin = await User.create({
      name: fields.name,
      email: fields.email,
      password: await bcrypt.hash(fields.password, 10),
      role: "admin",
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return duplicateEmail(res);
    }
    throw error;
  }
  res.status(201).json({ message: `Theatre owner ${admin.name} added`, admin: adminJson(admin) });
};

const updateAdmin = async (req, res) => {
  const fields = parseAdminFields(req.body, { passwordRequired: false });
  if (fields.error) {
    return res.status(400).json({ message: fields.error });
  }
  const admin = await findAdmin(req, res);
  if (!admin) return;

  try {
    await admin.update({
      name: fields.name,
      email: fields.email,
      ...(fields.password && { password: await bcrypt.hash(fields.password, 10) }),
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return duplicateEmail(res);
    }
    throw error;
  }

  // A new password signs the admin out everywhere, so an old login cannot keep working.
  if (fields.password) {
    await deleteAllSessions(admin.id);
  }
  res.status(200).json({
    message: fields.password
      ? `${admin.name} updated and signed out of every device`
      : `${admin.name} updated`,
    admin: adminJson(admin),
  });
};

const deleteAdmin = async (req, res) => {
  const admin = await findAdmin(req, res);
  if (!admin) return;

  // Theatres and movies keep the booking history, so an admin who still owns some is not deleted.
  const [theatres, movies] = await Promise.all([
    Theatre.count({ where: { adminId: admin.id } }),
    Movie.count({ where: { createdBy: admin.id } }),
  ]);
  if (theatres > 0 || movies > 0) {
    return res.status(409).json({
      message: `${admin.name} still owns ${theatres} theatre(s) and ${movies} movie(s), which keep booking history. Sign them out instead, or remove those first.`,
    });
  }

  await deleteAllSessions(admin.id);
  await admin.destroy();
  res.status(200).json({ message: `Theatre owner ${admin.name} deleted` });
};

const revokeAdminSessions = async (req, res) => {
  const admin = await findAdmin(req, res);
  if (!admin) return;

  await deleteAllSessions(admin.id);
  res.status(200).json({ message: `${admin.name} has been signed out of every device` });
};

module.exports = {
  listAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  revokeAdminSessions,
};
