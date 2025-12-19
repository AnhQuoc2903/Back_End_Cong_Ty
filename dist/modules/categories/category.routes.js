"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const category_controller_1 = require("./category.controller");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
// Tùy bạn, ở đây mình tạm dùng quyền VIEW_ARTIFACT cho xem, CREATE_ARTIFACT cho thêm/sửa/xóa
router.get("/", (0, rbac_1.requirePermission)("VIEW_ARTIFACT"), category_controller_1.getCategories);
router.post("/", (0, rbac_1.requirePermission)("CREATE_ARTIFACT"), category_controller_1.createCategory);
router.patch("/:id", (0, rbac_1.requirePermission)("CREATE_ARTIFACT"), category_controller_1.updateCategory);
router.delete("/:id", (0, rbac_1.requirePermission)("CREATE_ARTIFACT"), category_controller_1.deleteCategory);
router.get("/search", category_controller_1.searchCategories);
exports.default = router;
