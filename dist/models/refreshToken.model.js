"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshToken = void 0;
const mongoose_1 = require("mongoose");
const refreshTokenSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
}, { timestamps: true });
refreshTokenSchema.index({ token: 1 });
refreshTokenSchema.index({ user: 1 });
exports.RefreshToken = (0, mongoose_1.model)("RefreshToken", refreshTokenSchema);
