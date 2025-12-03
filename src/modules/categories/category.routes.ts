import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./category.controller";

const router = Router();

router.use(authMiddleware);

// Tùy bạn, ở đây mình tạm dùng quyền VIEW_ARTIFACT cho xem, CREATE_ARTIFACT cho thêm/sửa/xóa
router.get("/", requirePermission("VIEW_ARTIFACT"), getCategories);
router.post("/", requirePermission("CREATE_ARTIFACT"), createCategory);
router.patch("/:id", requirePermission("CREATE_ARTIFACT"), updateCategory);
router.delete("/:id", requirePermission("CREATE_ARTIFACT"), deleteCategory);

export default router;
