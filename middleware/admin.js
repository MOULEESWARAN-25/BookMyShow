const authMiddleware = require("./auth");

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};

const requireAdmin = [authMiddleware, adminOnly];

module.exports = requireAdmin;
