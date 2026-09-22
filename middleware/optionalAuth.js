const jwt = require("jsonwebtoken");
const { User } = require("../models");

const optionalAuth = async (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    return next();
  }

  const [scheme, token, ...extraParts] = authHeader.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token || extraParts.length > 0) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (
      !decoded ||
      typeof decoded !== "object" ||
      Array.isArray(decoded) ||
      !Number.isInteger(decoded.userId) ||
      decoded.userId <= 0
    ) {
      return next();
    }

    const user = await User.findByPk(decoded.userId, { attributes: ["id", "role"] });
    if (user) {
      req.user = { userId: user.id, role: user.role };
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = optionalAuth;
