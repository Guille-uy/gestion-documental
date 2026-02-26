import { Router } from "express";
import { getAuditLogsHandler } from "../controllers/audit.js";
import { authMiddleware, authorizationMiddleware } from "../middleware/auth.js";

const router = Router();

// Audit logs are only accessible to admins and quality managers
router.get(
  "/",
  authMiddleware,
  authorizationMiddleware(["ADMIN", "QUALITY_MANAGER"]),
  getAuditLogsHandler
);

export default router;
