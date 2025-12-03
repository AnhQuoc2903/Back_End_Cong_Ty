import { Schema, model } from "mongoose";

const permissionSchema = new Schema(
  {
    name: { type: String, unique: true, required: true },
    description: String,
    group: { type: String, default: "General" },
  },
  { timestamps: true }
);

export const Permission = model("Permission", permissionSchema);
