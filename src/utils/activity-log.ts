import { ActivityLog } from "../models/activity-log.model";
import { Types } from "mongoose";

interface LogParams {
  actorId: Types.ObjectId;
  actorSnapshot?: {
    _id: Types.ObjectId;
    email?: string;
    fullName?: string;
  };
  targetSnapshot?: {
    _id: Types.ObjectId;
    email?: string;
    fullName?: string;
  };
  action: string;
  targetType: string;
  targetId?: Types.ObjectId;
  before?: any;
  after?: any;
  ip?: string;
  userAgent?: string;
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
}: LogParams) {
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
  });
}
