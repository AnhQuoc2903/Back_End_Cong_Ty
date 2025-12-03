import { Schema, model } from "mongoose";

const artifactCategorySchema = new Schema(
  {
    name: { type: String, unique: true, required: true },
    description: String,
  },
  { timestamps: true }
);

export const ArtifactCategory = model(
  "ArtifactCategory",
  artifactCategorySchema
);
