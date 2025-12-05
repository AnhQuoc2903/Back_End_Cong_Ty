import { Request, Response } from "express";
import { User } from "../../models/user.model";
import { comparePassword } from "../../utils/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import { RefreshToken } from "../../models/refreshToken.model";

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
