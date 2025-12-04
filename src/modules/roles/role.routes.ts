import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  searchRoles,
} from "./role.controller";

const router = Router();
router.use(authMiddleware);

router.get("/", requirePermission("ADMIN_PANEL"), getRoles);
router.post("/", requirePermission("ADMIN_PANEL"), createRole);
router.patch("/:id", requirePermission("ADMIN_PANEL"), updateRole);
router.delete("/:id", requirePermission("ADMIN_PANEL"), deleteRole);

// permissions list
router.get(
  "/permissions/all",
  requirePermission("ADMIN_PANEL"),
  getPermissions
);
router.get("/search", searchRoles);

export default router;
