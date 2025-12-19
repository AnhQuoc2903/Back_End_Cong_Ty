"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Role = void 0;
// src/models/role.model.ts
const mongoose_1 = require("mongoose");
const roleSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    description: String,
    permissions: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Permission" }],
}, { timestamps: true });
roleSchema.index({ name: "text" });
exports.Role = (0, mongoose_1.model)("Role", roleSchema);
