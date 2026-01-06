import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";

import {
  getDepartments,
  getActiveDepartments,
  createDepartment,
  updateDepartment,
  disableDepartment,
  deleteDepartment,
} from "./department.controller";

const router = Router();

router.use(authMiddleware);

/**
 * ADMIN PANEL
 */
router.get("/", requirePermission("ADMIN_PANEL"), getDepartments);
router.post("/", requirePermission("ADMIN_PANEL"), createDepartment);
router.patch("/:id", requirePermission("ADMIN_PANEL"), updateDepartment);
router.patch(
  "/:id/disable",
  requirePermission("ADMIN_PANEL"),
  disableDepartment
);
router.delete("/:id", requirePermission("ADMIN_PANEL"), deleteDepartment);

/**
 * PUBLIC (đã login)
 * 👉 dùng cho dropdown
 */
router.get("/active", getActiveDepartments);

export default router;
