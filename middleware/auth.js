const jwt = require("jsonwebtoken");
const { users } = require("../data/store");

const authMiddleware = (req, res, next) => {
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

    const user = users.find((candidate) => candidate.id === decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = { userId: user.id, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;
