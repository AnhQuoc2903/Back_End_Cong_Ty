"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtifactTransaction = void 0;
const mongoose_1 = require("mongoose");
const artifactTransactionSchema = new mongoose_1.Schema({
    artifact: { type: mongoose_1.Types.ObjectId, ref: "Artifact", required: true },
    type: {
        type: String,
        enum: ["IMPORT", "EXPORT", "ADJUST"],
        required: true,
    },
    quantityChange: { type: Number, required: true },
    reason: String,
    createdBy: { type: mongoose_1.Types.ObjectId, ref: "User" },
}, { timestamps: true });
exports.ArtifactTransaction = (0, mongoose_1.model)("ArtifactTransaction", artifactTransactionSchema);
