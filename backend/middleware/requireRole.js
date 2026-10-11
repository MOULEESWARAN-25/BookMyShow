const authMiddleware = require("./auth");

const ROLE_NAMES = {
  user: "customers",
  admin: "theatre owners",
  super_admin: "the site owner",
};

// requireRole("admin") or requireRole("admin", "super_admin"): logged in, with one of these roles.
const requireRole = (...roles) => [
  authMiddleware,
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      const names = roles.map((role) => ROLE_NAMES[role]).join(" and ");
      return res.status(403).json({ message: `Only ${names} can do this` });
    }
    next();
  },
];

module.exports = requireRole;
