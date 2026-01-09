import { Response } from "express";
import cloudinary from "../../config/cloudinary";
import { AuthRequest } from "../../middleware/auth";
import { User } from "../../models/user.model";
import { Types } from "mongoose";
import { logActivity } from "../../utils/activity-log";
import fs from "fs/promises";

export async function uploadAvatar(req: AuthRequest, res: Response) {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const user = await User.findById(req.user!.id);
  if (!user) {
    await fs.unlink(req.file.path);
    return res.status(404).json({ message: "User not found" });
  }

  if (user.avatarPublicId) {
    await cloudinary.uploader.destroy(user.avatarPublicId);
  }

  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: "avatars",
    transformation: [{ width: 300, height: 300, crop: "fill" }],
  });

  // 🔥 3. DỌN FILE TẠM
  await fs.unlink(req.file.path);

  // 🔥 5. LOG
  const beforeAvatar = user.avatar;

  user.avatar = result.secure_url;
  user.avatarPublicId = result.public_id;
  await user.save();

  await logActivity({
    actorId: new Types.ObjectId(req.user!.id),

    actorSnapshot: {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
    },

    action: "UPDATE_AVATAR",
    details: "Cập nhật ảnh đại diện",

    targetType: "User",
    targetId: user._id,

    targetSnapshot: {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
    },

    before: {
      avatar: beforeAvatar,
    },
    after: {
      avatar: user.avatar,
    },

    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.json({ avatar: user.avatar });
}

export async function deleteAvatar(req: AuthRequest, res: Response) {
  const user = await User.findById(req.user!.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.avatarPublicId) {
    await cloudinary.uploader.destroy(user.avatarPublicId);
  }

  const beforeAvatar = user.avatar;

  user.avatar = undefined;
  user.avatarPublicId = undefined;
  await user.save();

  await logActivity({
    actorId: new Types.ObjectId(req.user!.id),

    actorSnapshot: {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
    },

    action: "DELETE_AVATAR",
    details: "Xóa ảnh đại diện",

    targetType: "User",
    targetId: user._id,

    targetSnapshot: {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
    },

    before: {
      avatar: beforeAvatar,
    },
    after: {
      avatar: null,
    },

    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.json({ message: "Avatar deleted" });
}
