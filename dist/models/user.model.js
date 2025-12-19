"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true },
    fullName: String,
    passwordHash: String,
    roles: [{ type: mongoose_1.Types.ObjectId, ref: "Role" }],
    isActive: { type: Boolean, default: true },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
}, { timestamps: true });
userSchema.index({ email: "text", fullName: "text" });
exports.User = (0, mongoose_1.model)("User", userSchema);
