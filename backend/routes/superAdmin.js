const express = require("express");
const requireSuperAdmin = require("../middleware/superAdmin");
const {
  listAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  revokeAdminSessions,
} = require("../controllers/superAdmin");

const router = express.Router();

router.use(requireSuperAdmin);
router.get("/admins", listAdmins);
router.post("/admins", createAdmin);
router.patch("/admins/:adminId", updateAdmin);
router.delete("/admins/:adminId", deleteAdmin);
router.post("/admins/:adminId/revoke-sessions", revokeAdminSessions);

module.exports = router;
