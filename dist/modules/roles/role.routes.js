"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const rbac_1 = require("../../middleware/rbac");
const role_controller_1 = require("./role.controller");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get("/", (0, rbac_1.requirePermission)("ADMIN_PANEL"), role_controller_1.getRoles);
router.post("/", (0, rbac_1.requirePermission)("ADMIN_PANEL"), role_controller_1.createRole);
router.patch("/:id", (0, rbac_1.requirePermission)("ADMIN_PANEL"), role_controller_1.updateRole);
router.delete("/:id", (0, rbac_1.requirePermission)("ADMIN_PANEL"), role_controller_1.deleteRole);
// permissions list
router.get("/permissions/all", (0, rbac_1.requirePermission)("ADMIN_PANEL"), role_controller_1.getPermissions);
router.get("/search", role_controller_1.searchRoles);
exports.default = router;
