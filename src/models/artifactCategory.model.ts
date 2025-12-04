// src/models/artifactCategory.model.ts (nếu dùng ArtifactCategory)
import { Schema, model } from "mongoose";

const ArtifactCategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: String,
  },
  { timestamps: true }
);

// optional text index
ArtifactCategorySchema.index({ name: "text" });

export const ArtifactCategory = model(
  "ArtifactCategory",
  ArtifactCategorySchema
);
