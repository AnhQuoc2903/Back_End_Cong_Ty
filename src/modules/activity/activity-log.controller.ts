import { Request, Response } from "express";
import { ActivityLog } from "../../models/activity-log.model";
import ExcelJS from "exceljs";

/**
 * GET /api/activity-logs/users
 * 👉 Lấy tất cả lịch sử liên quan tới User
 */

const ACTION_LABEL: Record<string, string> = {
  CREATE_USER: "Tạo người dùng",
  UPDATE_USER: "Cập nhật người dùng",
  DELETE_USER: "Xóa người dùng",
};

export async function getUserActivityLogs(req: Request, res: Response) {
  const limit = Math.min(100, Number(req.query.limit) || 20);
  const page = Math.max(1, Number(req.query.page) || 1);

  const { action, fromDate, toDate } = req.query;

  const filter: any = {
    targetType: "User",
  };

  if (action) {
    filter.action = action;
  }

  // ✅ FILTER THEO NGÀY
  if (fromDate || toDate) {
    filter.createdAt = {};

    if (fromDate) {
      filter.createdAt.$gte = new Date(fromDate as string);
    }

    if (toDate) {
      const end = new Date(toDate as string);
      end.setHours(23, 59, 59, 999); // 🔥 RẤT QUAN TRỌNG
      filter.createdAt.$lte = end;
    }
  }

  const logs = await ActivityLog.find(filter)
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

export async function exportUserActivityLogs(req: Request, res: Response) {
  const { action, fromDate, toDate } = req.query;

  const filter: any = { targetType: "User" };

  if (action) {
    filter.action = action;
  }

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate as string);
    if (toDate) {
      const end = new Date(toDate as string);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const logs = await ActivityLog.find(filter)
    .populate("actor", "email fullName")
    .sort({ createdAt: -1 })
    .lean();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Activity Logs");

  sheet.columns = [
    { header: "Hành động", key: "action", width: 20 },
    { header: "Người thực hiện", key: "actor", width: 30 },
    { header: "Email", key: "email", width: 30 },
    { header: "Thời gian", key: "createdAt", width: 25 },
  ];

  logs.forEach((log: any) => {
    const actor = log.actor as {
      fullName?: string;
      email?: string;
    } | null;

    sheet.addRow({
      action: ACTION_LABEL[log.action] || log.action,
      actor: actor?.fullName || "Hệ thống",
      email: actor?.email || "",
      createdAt: new Date(log.createdAt).toLocaleString("vi-VN"),
    });
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=activity_logs.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();
}

export async function getActivityLogStats(req: Request, res: Response) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [totalActions, todayActions, userActions] = await Promise.all([
    ActivityLog.countDocuments(),
    ActivityLog.countDocuments({
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    }),
    ActivityLog.countDocuments({ targetType: "User" }),
  ]);

  res.json({
    totalActions,
    todayActions,
    userActions,
  });
}
