import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import multer from "multer";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  searchUsers,
  updateMyProfile,
} from "./user.controller";
import { uploadAvatar, deleteAvatar } from "./user.upload.controller";

const router = Router();
router.use(authMiddleware);

router.patch("/me/profile", updateMyProfile);

// ===== UPLOAD AVATAR =====
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Chỉ cho phép upload hình ảnh"));
    }
    cb(null, true);
  },
});

router.post("/me/avatar", upload.single("avatar"), uploadAvatar);

router.delete("/me/avatar", deleteAvatar);

router.get("/search", requirePermission("ADMIN_PANEL"), searchUsers);
router.get("/", requirePermission("ADMIN_PANEL"), getUsers);
router.post("/", requirePermission("ADMIN_PANEL"), createUser);
router.patch("/:id", requirePermission("ADMIN_PANEL"), updateUser);
router.delete("/:id", requirePermission("ADMIN_PANEL"), deleteUser);

export default router;
