import { Schema, model, Types, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  fullName?: string;
  passwordHash?: string;

  roles: Types.ObjectId[];
  department?: Types.ObjectId;

  isActive: boolean;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    fullName: String,
    passwordHash: String,

    roles: [{ type: Types.ObjectId, ref: "Role" }],

    department: {
      type: Types.ObjectId,
      ref: "Department",
      required: false,
    },

    isActive: { type: Boolean, default: true },

    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index({ email: "text", fullName: "text" });

export const User = model<IUser>("User", userSchema);
