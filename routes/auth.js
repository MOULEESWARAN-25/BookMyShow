const express = require("express");
const authMiddleware = require("../middleware/auth");

const { signup, login, logout } = require("../controllers/auth");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);

module.exports = router;
