const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { getSessionUserId } = require("../utils/session");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const [scheme, token, ...extraParts] = authHeader.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token || extraParts.length > 0) {
    return res
      .status(401)
      .json({ message: "Authorization must use the Bearer token format" });
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
      return res.status(401).json({ message: "Invalid token" });
    }

    const sessionUserId = await getSessionUserId(token);
    if (sessionUserId !== decoded.userId) {
      return res.status(401).json({ message: "Session has expired or been logged out" });
    }

    const user = await User.findByPk(decoded.userId, { attributes: ["id", "role"] });
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = { userId: user.id, role: user.role };
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;
