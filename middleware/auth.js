const jwt = require("jsonwebtoken");
const pool = require("../db/pool");

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

    const sessionResult = await pool.query(
      "SELECT id FROM sessions WHERE token = $1 AND expires_at > now()",
      [token],
    );
    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ message: "Session has expired or been logged out" });
    }

    const result = await pool.query("SELECT id, role FROM users WHERE id = $1", [decoded.userId]);
    const user = result.rows[0];
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
