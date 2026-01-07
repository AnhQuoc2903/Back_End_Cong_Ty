import { Request, Response } from "express";
import { ActivityLog } from "../../models/activity-log.model";

/**
 * GET /api/activity-logs/users
 * 👉 Lấy tất cả lịch sử liên quan tới User
 */
export async function getUserActivityLogs(req: Request, res: Response) {
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const page = Math.max(1, Number(req.query.page) || 1);
  const { action } = req.query;

  const filter: any = {
    targetType: "User",
  };

  if (action) {
    filter.action = action;
  }

  const logs = await ActivityLog.find(filter)
    .populate("actor", "email fullName")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await ActivityLog.countDocuments(filter);

  res.json({ data: logs, total });
}

/**
 * GET /api/activity-logs/users/:userId
 * 👉 Lấy lịch sử hoạt động của 1 user cụ thể
 */
export async function getActivityLogsByUser(req: Request, res: Response) {
  const { userId } = req.params;

  const limit = Math.min(100, Number(req.query.limit) || 20);
  const page = Math.max(1, Number(req.query.page) || 1);

  const logs = await ActivityLog.find({
    targetType: "User",
    targetId: userId,
  })
    .populate("actor", "email fullName")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const total = await ActivityLog.countDocuments({
    targetType: "User",
    targetId: userId,
  });

  res.json({ data: logs, total });
}
