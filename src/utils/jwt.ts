import jwt from "jsonwebtoken";
import { RefreshToken } from "../models/refreshToken.model";

const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "CHANGE_THIS_ACCESS_SECRET";
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "CHANGE_THIS_REFRESH_SECRET";

// Access token short-lived
export function signAccessToken(payload: any) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET);
}

// Refresh token long-lived
export function signRefreshToken(payload: any) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "30d" });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET);
}

// Persist refresh token in DB
export async function createRefreshToken(userId: string) {
  const token = signRefreshToken({ id: userId });
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ user: userId, token, expiresAt });
  return token;
}

// Revoke or delete
export async function revokeRefreshToken(token: string) {
  await RefreshToken.findOneAndUpdate({ token }, { revoked: true });
}
