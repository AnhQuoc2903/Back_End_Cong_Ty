"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const multer_1 = __importDefault(require("multer"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const artifact_routes_1 = __importDefault(require("./modules/artifacts/artifact.routes"));
const category_routes_1 = __importDefault(require("./modules/categories/category.routes"));
const ai_routes_1 = __importDefault(require("./modules/ai/ai.routes"));
const user_routes_1 = __importDefault(require("./modules/user/user.routes"));
const role_routes_1 = __importDefault(require("./modules/roles/role.routes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(express_1.default.json());
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
app.use((err, _req, res, _next) => {
    console.error("Global error handler:", err);
    if (err instanceof multer_1.default.MulterError)
        return res.status(400).json({ message: err.message, code: err.code });
    if (err && err.message)
        return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: "Internal server error" });
});
app.use("/api/auth", authLimiter);
// 👇 mount routes SAU khi đã dùng cors + json + helmet
app.use("/api/auth", auth_routes_1.default);
app.use("/api/artifacts", artifact_routes_1.default);
app.use("/api/categories", category_routes_1.default);
app.use("/api/users", user_routes_1.default);
app.use("/api/roles", role_routes_1.default);
app.use("/api/ai", ai_routes_1.default);
exports.default = app;
