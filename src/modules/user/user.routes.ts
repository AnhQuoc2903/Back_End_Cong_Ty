import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  searchUsers,
} from "./user.controller";

const router = Router();
router.use(authMiddleware);

router.get("/search", requirePermission("ADMIN_PANEL"), searchUsers);
router.get("/", requirePermission("ADMIN_PANEL"), getUsers);
router.post("/", requirePermission("ADMIN_PANEL"), createUser);
router.patch("/:id", requirePermission("ADMIN_PANEL"), updateUser);
router.delete("/:id", requirePermission("ADMIN_PANEL"), deleteUser);

export default router;
