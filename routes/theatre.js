const express = require("express");
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");
const { createTheatre } = require("../controllers/theatre");

const router = express.Router();

router.post("/", authMiddleware, adminMiddleware, createTheatre);

module.exports = router;
