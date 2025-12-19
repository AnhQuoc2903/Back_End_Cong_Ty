"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer "))
        return res.status(401).json({ message: "Unauthorized" });
    const token = header.substring(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
        // decoded should contain { id, email, roles, permissions }
        req.user = {
            id: decoded.id,
            email: decoded.email,
            roles: decoded.roles || [],
            permissions: decoded.permissions || [],
        };
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}
