import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import {
  getUserActivityLogs,
  getActivityLogsByUser,
} from "./activity-log.controller";

const router = Router();

router.use(authMiddleware);

// Xem tất cả log user
router.get("/users", requirePermission("ADMIN_PANEL"), getUserActivityLogs);

// Xem log của 1 user
router.get(
  "/users/:userId",
  requirePermission("ADMIN_PANEL"),
  getActivityLogsByUser
);

export default router;
