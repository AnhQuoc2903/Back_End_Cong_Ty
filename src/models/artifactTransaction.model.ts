import { Schema, model, Types } from "mongoose";

const artifactTransactionSchema = new Schema(
  {
    artifact: { type: Types.ObjectId, ref: "Artifact", required: true },
    type: {
      type: String,
      enum: ["IMPORT", "EXPORT", "ADJUST"],
      required: true,
    },
    quantityChange: { type: Number, required: true },
    previousQuantity: { type: Number },
    newQuantity: { type: Number }, // ✅ nhiều ảnh
    reason: String,
    createdBy: { type: Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const ArtifactTransaction = model(
  "ArtifactTransaction",
  artifactTransactionSchema
);
