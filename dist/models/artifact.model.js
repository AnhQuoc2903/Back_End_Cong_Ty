"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Artifact = void 0;
const mongoose_1 = require("mongoose");
const artifactSchema = new mongoose_1.Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    category: { type: mongoose_1.Types.ObjectId, ref: "ArtifactCategory", default: null },
    location: String,
    status: { type: String, default: "bosung" },
    quantityCurrent: { type: Number, default: 0 },
    imageUrl: { type: String },
    imagePublicId: { type: String },
}, { timestamps: true });
exports.Artifact = (0, mongoose_1.model)("Artifact", artifactSchema);
