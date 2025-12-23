import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { User } from "../../models/user.model";
import { comparePassword } from "../../utils/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import { RefreshToken } from "../../models/refreshToken.model";
import { sendEmail } from "../../utils/sendEmail";

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://www.quan-ly-hien-vat.online"
    : "https://font-end-cong-ty.vercel.app");

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// helper to build user payload (roles, permissions)
async function buildUserPayload(user: any) {
  const roles = (user.roles || []).map((r: any) => r.name);
  const permsSet = new Set<string>();
  (user.roles || []).forEach((r: any) => {
    (r.permissions || []).forEach((p: any) => permsSet.add(p.name));
  });
  const permissions = Array.from(permsSet);
  return { id: user._id.toString(), email: user.email, roles, permissions };
}

// create & persist refresh token (one-time rotation)
async function persistRefreshToken(userId: string) {
  const token = signRefreshToken({ id: userId });
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ user: userId, token, expiresAt });
  return token;
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user: any = await User.findOne({ email }).populate({
      path: "roles",
      populate: { path: "permissions" },
    });
    if (!user)
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok)
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });

    if (user.isActive === false) {
      return res
        .status(403)
        .json({ message: "Tài khoản đã bị khóa hoặc chưa kích hoạt" });
    }

    const payload = await buildUserPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = await persistRefreshToken(user._id.toString());

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        roles: payload.roles,
        permissions: payload.permissions,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Missing refresh token" });

    const stored = await RefreshToken.findOne({ token: refreshToken });

    // not found or revoked
    if (!stored || stored.revoked) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // verify JWT
    let payload: any;
    try {
      payload = verifyRefreshToken(refreshToken) as any;
    } catch (err) {
      // token invalid/expired: mark revoked in DB and reject
      try {
        await RefreshToken.findOneAndUpdate(
          { token: refreshToken },
          { revoked: true }
        );
      } catch (e) {
        console.warn("failed to revoke refresh token", e);
      }
      return res
        .status(401)
        .json({ message: "Refresh token expired or invalid" });
    }

    // ensure user exists
    const user = await User.findById(payload.id).populate({
      path: "roles",
      populate: { path: "permissions" },
    });
    if (!user) return res.status(401).json({ message: "User not found" });

    // rotation: delete old refresh token record (one-time use)
    await RefreshToken.findOneAndDelete({ token: refreshToken });

    // create new refresh token
    const newRefreshToken = await persistRefreshToken(user._id.toString());

    // create new access token with full payload (roles/permissions)
    const newPayload = await buildUserPayload(user);
    const accessToken = signAccessToken(newPayload);

    return res.json({
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        roles: newPayload.roles,
        permissions: newPayload.permissions,
      },
    });
  } catch (err) {
    console.error("refreshToken error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.findOneAndUpdate(
        { token: refreshToken },
        { revoked: true }
      );
    }
    return res.json({ message: "Đã đăng xuất" });
  } catch (err) {
    console.error("logout error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email là bắt buộc" });
    }

    const user = await User.findOne({ email });

    // luôn trả response giống nhau (tránh leak email)
    res.json({
      message: "Nếu email tồn tại, hệ thống sẽ gửi mail hướng dẫn.",
    });

    // nếu không có user thì dừng ở đây
    if (!user) return;

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    const resetLink = `${FRONTEND_URL.replace(
      /\/$/,
      ""
    )}/reset-password?token=${token}`;

    // gửi mail background – KHÔNG await
    sendEmail({
      to: user.email,
      subject: "Đặt lại mật khẩu",
      html: `
        <p>Chào ${user.fullName || user.email},</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu.</p>
        <p>Nhấn vào link sau để đặt lại mật khẩu (có hiệu lực 1 giờ):</p>
        <p><a href="${resetLink}" target="_blank">${resetLink}</a></p>
        <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      `,
    }).catch((err) => {
      console.error("Send email failed:", err);
    });
  } catch (err) {
    console.error("forgotPassword fatal error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

// ============ RESET PASSWORD ============
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Thiếu token hoặc mật khẩu mới" });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        message: "Mật khẩu phải ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    user.passwordHash = passwordHash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
