"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtifactCategory = void 0;
// src/models/artifactCategory.model.ts (nếu dùng ArtifactCategory)
const mongoose_1 = require("mongoose");
const ArtifactCategorySchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    description: String,
}, { timestamps: true });
// optional text index
ArtifactCategorySchema.index({ name: "text" });
exports.ArtifactCategory = (0, mongoose_1.model)("ArtifactCategory", ArtifactCategorySchema);
