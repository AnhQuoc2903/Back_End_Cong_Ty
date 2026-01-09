import { ActivityLog } from "../models/activity-log.model";
import { Types } from "mongoose";

interface LogParams {
  actorId: Types.ObjectId;

  actorSnapshot?: {
    _id: Types.ObjectId;
    email?: string;
    fullName?: string;
    phone?: string;
    avatar?: string;
  };

  targetSnapshot?: {
    _id: Types.ObjectId;
    email?: string;
    fullName?: string;
    phone?: string;
    avatar?: string;
  };

  action: string;
  targetType: string;
  targetId?: Types.ObjectId;

  before?: Record<string, any>;
  after?: Record<string, any>;

  ip?: string;
  userAgent?: string;
  details?: string;
}

export async function logActivity({
  actorId,
  actorSnapshot,
  targetSnapshot,
  action,
  targetType,
  targetId,
  before,
  after,
  ip,
  userAgent,
  details,
}: LogParams) {
  try {
    await ActivityLog.create({
      actor: actorId,
      actorSnapshot,
      targetSnapshot,
      action,
      targetType,
      targetId,
      before,
      after,
      ip,
      userAgent,
      details,
    });
  } catch (error) {
    console.error("❌ Activity log failed:", error);
  }
}
