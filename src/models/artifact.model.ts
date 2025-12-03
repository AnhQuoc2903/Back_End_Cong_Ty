import { Schema, model, Types } from "mongoose";

const artifactSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    category: { type: Types.ObjectId, ref: "ArtifactCategory", default: null },
    location: String,
    status: { type: String, default: "bosung" },
    quantityCurrent: { type: Number, default: 0 },
    imageUrl: { type: String },
    imagePublicId: { type: String },
  },
  { timestamps: true }
);

export const Artifact = model("Artifact", artifactSchema);
