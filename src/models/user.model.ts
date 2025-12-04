import { Schema, model, Types } from "mongoose";
const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    fullName: String,
    passwordHash: String,
    roles: [{ type: Types.ObjectId, ref: "Role" }],
  },
  { timestamps: true }
);

userSchema.index({ email: "text", fullName: "text" });
export const User = model("User", userSchema);
