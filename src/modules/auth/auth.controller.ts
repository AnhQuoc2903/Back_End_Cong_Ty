import { Request, Response } from "express";
import { User } from "../../models/user.model";
import { comparePassword } from "../../utils/password";
import {
  signAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import { RefreshToken } from "../../models/refreshToken.model";

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

    const roles = (user.roles || []).map((r: any) => r.name);
    const permsSet = new Set<string>();
    (user.roles || []).forEach((r: any) => {
      (r.permissions || []).forEach((p: any) => permsSet.add(p.name));
    });
    const permissions = Array.from(permsSet);

    const payload = {
      id: user._id.toString(),
      email: user.email,
      roles,
      permissions,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = await createRefreshToken(user._id.toString());

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        roles,
        permissions,
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
    if (!stored || stored.revoked) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    let payload: any;
    try {
      payload = verifyRefreshToken(refreshToken) as any;
    } catch (err) {
      await RefreshToken.findOneAndUpdate(
        { token: refreshToken },
        { revoked: true }
      );
      return res
        .status(401)
        .json({ message: "Refresh token expired or invalid" });
    }

    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    await RefreshToken.findOneAndDelete({ token: refreshToken });
    const newRefreshToken = await createRefreshToken(user._id.toString());
    const accessToken = signAccessToken({
      id: user._id.toString(),
      email: user.email,
    });

    return res.json({
      accessToken,
      refreshToken: newRefreshToken,
      user: { id: user._id, email: user.email, fullName: user.fullName },
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
