import { Request, Response } from "express";
import { ArtifactTransaction } from "../../models/artifactTransaction.model";
import { Artifact } from "../../models/artifact.model";
import ExcelJS from "exceljs";

/**
 * GET /api/dashboard/monthly-stats
 */
export const getMonthlyStats = async (req: Request, res: Response) => {
  try {
    const data = await ArtifactTransaction.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          imports: {
            $sum: {
              $cond: [{ $eq: ["$type", "IMPORT"] }, "$quantityChange", 0],
            },
          },
          exports: {
            $sum: {
              $cond: [{ $eq: ["$type", "EXPORT"] }, "$quantityChange", 0],
            },
          },

          adjustments: {
            $sum: {
              $cond: [
                { $eq: ["$type", "ADJUST"] },
                { $abs: "$quantityChange" },
                0,
              ],
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          _id: 0,
          month: { $concat: ["Th", { $toString: "$_id.month" }] },
          imports: 1,
          exports: 1,
          adjustments: 1,
        },
      },
    ]);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Dashboard stats error" });
  }
};

// GET /api/dashboard/low-stock?threshold=5
export const getLowStockArtifacts = async (req: Request, res: Response) => {
  const threshold = Number(req.query.threshold || 5);

  const artifacts = await Artifact.find({
    $or: [
      { quantityCurrent: 0 },
      { quantityCurrent: { $gt: 0, $lte: threshold } },
    ],
  })
    .populate("category", "name")
    .lean();

  const result = artifacts.map((a) => ({
    _id: a._id,
    name: a.name,
    code: a.code,
    quantity: a.quantityCurrent,
    minStockLevel: threshold,
    category: a.category,
  }));

  res.json(result);
};

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const [totalArtifacts, totalTransactions, importCount, exportCount] =
      await Promise.all([
        Artifact.countDocuments(),

        ArtifactTransaction.countDocuments({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        }),

        ArtifactTransaction.countDocuments({
          type: "IMPORT",
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        }),

        ArtifactTransaction.countDocuments({
          type: "EXPORT",
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        }),
      ]);

    res.json({
      totalArtifacts,
      totalTransactions,
      importCount,
      exportCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Monthly summary error" });
  }
};

// GET /api/dashboard/export-transactions-excel
export const exportDashboardTransactionsExcel = async (
  req: Request,
  res: Response
) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59
  );

  const transactions = await ArtifactTransaction.find({
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  })
    .populate("artifact", "name code")
    .populate("createdBy", "fullName email")
    .lean();

  if (!transactions.length) {
    return res.status(404).json({ message: "Không có giao dịch trong tháng" });
  }

  // ====== TẠO EXCEL ======
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Giao dịch tháng");

  worksheet.columns = [
    { header: "Ngày", key: "date", width: 20 },
    { header: "Mã hiện vật", key: "code", width: 18 },
    { header: "Tên hiện vật", key: "name", width: 30 },
    { header: "Loại giao dịch", key: "type", width: 15 },
    { header: "Số lượng", key: "quantity", width: 12 },
  ];

  transactions.forEach((t) => {
    const artifact = t.artifact as any;

    worksheet.addRow({
      date: new Date(t.createdAt).toLocaleString("vi-VN"),
      code: artifact?.code || "",
      name: artifact?.name || "Không xác định",
      type: t.type,
      quantity: t.quantityChange,
    });
  });

  // style header cho đẹp
  worksheet.getRow(1).font = { bold: true };

  // ====== TRẢ FILE ======
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=dashboard_transactions_${now
      .toISOString()
      .slice(0, 7)}.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();
};
