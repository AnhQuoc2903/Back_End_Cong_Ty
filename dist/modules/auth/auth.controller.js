"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = void 0;
exports.login = login;
exports.refreshToken = refreshToken;
exports.logout = logout;
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_model_1 = require("../../models/user.model");
const password_1 = require("../../utils/password");
const jwt_1 = require("../../utils/jwt");
const refreshToken_model_1 = require("../../models/refreshToken.model");
const sendEmail_1 = require("../../utils/sendEmail");
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
// helper to build user payload (roles, permissions)
async function buildUserPayload(user) {
    const roles = (user.roles || []).map((r) => r.name);
    const permsSet = new Set();
    (user.roles || []).forEach((r) => {
        (r.permissions || []).forEach((p) => permsSet.add(p.name));
    });
    const permissions = Array.from(permsSet);
    return { id: user._id.toString(), email: user.email, roles, permissions };
}
// create & persist refresh token (one-time rotation)
async function persistRefreshToken(userId) {
    const token = (0, jwt_1.signRefreshToken)({ id: userId });
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await refreshToken_model_1.RefreshToken.create({ user: userId, token, expiresAt });
    return token;
}
async function login(req, res) {
    try {
        const { email, password } = req.body;
        const user = await user_model_1.User.findOne({ email }).populate({
            path: "roles",
            populate: { path: "permissions" },
        });
        if (!user)
            return res.status(400).json({ message: "Sai email hoặc mật khẩu" });
        const ok = await (0, password_1.comparePassword)(password, user.passwordHash);
        if (!ok)
            return res.status(400).json({ message: "Sai email hoặc mật khẩu" });
        if (user.isActive === false) {
            return res
                .status(403)
                .json({ message: "Tài khoản đã bị khóa hoặc chưa kích hoạt" });
        }
        const payload = await buildUserPayload(user);
        const accessToken = (0, jwt_1.signAccessToken)(payload);
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
    }
    catch (err) {
        console.error("login error:", err);
        return res.status(500).json({ message: "Lỗi server" });
    }
}
async function refreshToken(req, res) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            return res.status(400).json({ message: "Missing refresh token" });
        const stored = await refreshToken_model_1.RefreshToken.findOne({ token: refreshToken });
        // not found or revoked
        if (!stored || stored.revoked) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }
        // verify JWT
        let payload;
        try {
            payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
        }
        catch (err) {
            // token invalid/expired: mark revoked in DB and reject
            try {
                await refreshToken_model_1.RefreshToken.findOneAndUpdate({ token: refreshToken }, { revoked: true });
            }
            catch (e) {
                console.warn("failed to revoke refresh token", e);
            }
            return res
                .status(401)
                .json({ message: "Refresh token expired or invalid" });
        }
        // ensure user exists
        const user = await user_model_1.User.findById(payload.id).populate({
            path: "roles",
            populate: { path: "permissions" },
        });
        if (!user)
            return res.status(401).json({ message: "User not found" });
        // rotation: delete old refresh token record (one-time use)
        await refreshToken_model_1.RefreshToken.findOneAndDelete({ token: refreshToken });
        // create new refresh token
        const newRefreshToken = await persistRefreshToken(user._id.toString());
        // create new access token with full payload (roles/permissions)
        const newPayload = await buildUserPayload(user);
        const accessToken = (0, jwt_1.signAccessToken)(newPayload);
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
    }
    catch (err) {
        console.error("refreshToken error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}
async function logout(req, res) {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await refreshToken_model_1.RefreshToken.findOneAndUpdate({ token: refreshToken }, { revoked: true });
        }
        return res.json({ message: "Đã đăng xuất" });
    }
    catch (err) {
        console.error("logout error:", err);
        res.status(500).json({ message: "Server error" });
    }
}
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ message: "Email là bắt buộc" });
        const user = await user_model_1.User.findOne({ email });
        if (!user) {
            return res.json({
                message: "Nếu email tồn tại, hệ thống sẽ gửi mail hướng dẫn.",
            });
        }
        const token = crypto_1.default.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 60 * 60 * 1000);
        user.resetPasswordToken = token;
        user.resetPasswordExpires = expires;
        await user.save();
        const resetLink = `${FRONTEND_URL.replace(/\/$/, "")}/reset-password?token=${token}`;
        await (0, sendEmail_1.sendEmail)({
            to: user.email,
            subject: "Đặt lại mật khẩu",
            html: `
        <p>Chào ${user.fullName || user.email},</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu.</p>
        <p>Nhấn vào link sau để đặt lại mật khẩu (có hiệu lực 1 giờ):</p>
        <p><a href="${resetLink}" target="_blank">${resetLink}</a></p>
        <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      `,
        });
        return res.json({
            message: "Nếu email tồn tại, hệ thống sẽ gửi mail hướng dẫn.",
        });
    }
    catch (err) {
        console.error("forgotPassword error:", err);
        return res.status(500).json({ message: "Lỗi server" });
    }
};
exports.forgotPassword = forgotPassword;
// ============ RESET PASSWORD ============
const resetPassword = async (req, res) => {
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
        const user = await user_model_1.User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() },
        });
        if (!user) {
            return res
                .status(400)
                .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
        }
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        user.passwordHash = passwordHash;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();
        return res.json({ message: "Đặt lại mật khẩu thành công" });
    }
    catch (err) {
        console.error("resetPassword error:", err);
        return res.status(500).json({ message: "Lỗi server" });
    }
};
exports.resetPassword = resetPassword;
