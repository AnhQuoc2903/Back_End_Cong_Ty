import { Schema, model, Types } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    fullName: String,
    isActive: { type: Boolean, default: true },
    roles: [{ type: Types.ObjectId, ref: "Role" }],
  },
  { timestamps: true }
);

export const User = model("User", userSchema);
