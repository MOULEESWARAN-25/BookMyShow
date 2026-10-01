const express = require("express");
const { trackEmailOpen } = require("../controllers/tracking");

const router = express.Router();

router.get("/open/:token", trackEmailOpen);

module.exports = router;
