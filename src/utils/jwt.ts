import jwt from "jsonwebtoken";

const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "CHANGE_THIS_ACCESS_SECRET";
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "CHANGE_THIS_REFRESH_SECRET";

// Access token (short-lived)
export function signAccessToken(payload: any) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
}
export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET);
}

// Refresh token (long-lived)
export function signRefreshToken(payload: any) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "30d" });
}
export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET);
}
