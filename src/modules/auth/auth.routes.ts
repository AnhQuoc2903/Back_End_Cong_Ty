import express from "express";
import {
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
} from "./auth.controller";
import { authMiddleware } from "../../middleware/auth";
import { changePasswordLimiter } from "../../middleware/rateLimit";

const router = express.Router();

router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post(
  "/change-password",
  authMiddleware,
  changePasswordLimiter,
  changePassword
);

export default router;
