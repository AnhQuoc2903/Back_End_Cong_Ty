"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = void 0;
const mongoose_1 = require("mongoose");
const permissionSchema = new mongoose_1.Schema({
    name: { type: String, unique: true, required: true },
    description: String,
    group: { type: String, default: "General" },
}, { timestamps: true });
exports.Permission = (0, mongoose_1.model)("Permission", permissionSchema);
