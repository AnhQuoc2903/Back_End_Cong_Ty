// src/models/role.model.ts
import { Schema, model } from "mongoose";

const roleSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    permissions: [{ type: Schema.Types.ObjectId, ref: "Permission" }],
  },
  { timestamps: true }
);

roleSchema.index({ name: "text" });
export const Role = model("Role", roleSchema);
