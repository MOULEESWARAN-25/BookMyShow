const express = require("express");
const authMiddleware = require("../middleware/auth");
const { rateLimit } = require("../middleware/rateLimit");

const { signup, login, logout } = require("../controllers/auth");

const router = express.Router();

router.post(
  "/signup",
  rateLimit({
    name: "signup",
    capacity: 5,
    refillSeconds: 12 * 60,
    message: "Too many signups from this network. Try again later",
  }),
  signup,
);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);

module.exports = router;
