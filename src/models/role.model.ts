import { Schema, model, Types } from "mongoose";

const roleSchema = new Schema(
  {
    name: { type: String, unique: true, required: true },
    description: String,
    permissions: [{ type: Types.ObjectId, ref: "Permission" }],
  },
  { timestamps: true }
);

export const Role = model("Role", roleSchema);
