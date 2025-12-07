import express from "express";
import {
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
} from "./auth.controller";

const router = express.Router();

router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
