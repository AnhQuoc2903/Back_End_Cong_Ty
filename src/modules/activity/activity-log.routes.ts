import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import {
  getUserActivityLogs,
  getActivityLogsByUser,
  exportUserActivityLogs,
  getActivityLogStats,
} from "./activity-log.controller";

const router = Router();

router.use(authMiddleware);

router.get(
  "/users/export",
  requirePermission("ADMIN_PANEL"),
  exportUserActivityLogs
);

router.get(
  "/users/stats",
  requirePermission("ADMIN_PANEL"),
  getActivityLogStats
);

// Xem tất cả log user
router.get("/users", requirePermission("ADMIN_PANEL"), getUserActivityLogs);

// Xem log của 1 user
router.get(
  "/users/:userId",
  requirePermission("ADMIN_PANEL"),
  getActivityLogsByUser
);

export default router;
