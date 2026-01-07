import ExcelJS from "exceljs";
import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { ArtifactTransaction } from "../../models/artifactTransaction.model";
import { Artifact } from "../../models/artifact.model";

export async function exportArtifactTransactionsExcel(
  req: AuthRequest,
  res: Response
) {
  try {
    const artifactId = req.params.id;

    const artifact = await Artifact.findById(artifactId).lean();
    if (!artifact) {
      return res.status(404).json({ message: "Không tìm thấy hiện vật" });
    }

    const transactions = await ArtifactTransaction.find({
      artifact: artifactId,
    })
      .sort({ createdAt: -1 })
      .populate("createdBy", "fullName email")
      .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Lịch sử giao dịch");

    worksheet.columns = [
      { header: "STT", key: "stt", width: 6 },
      { header: "Loại giao dịch", key: "type", width: 15 },
      { header: "Số lượng", key: "quantityChange", width: 12 },
      { header: "Lý do / Ghi chú", key: "reason", width: 30 },
      { header: "Người thực hiện", key: "user", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Thời gian", key: "createdAt", width: 20 },
    ];

    transactions.forEach((tx: any, index) => {
      const user = tx.createdBy as {
        fullName?: string;
        email?: string;
      } | null;

      worksheet.addRow({
        stt: index + 1,
        type:
          tx.type === "IMPORT"
            ? "Nhập kho"
            : tx.type === "EXPORT"
            ? "Xuất kho"
            : "Điều chỉnh",
        quantityChange: tx.quantityChange,
        reason: tx.reason || "",
        user: user?.fullName || "",
        email: user?.email || "",
        createdAt: new Date(tx.createdAt).toLocaleString("vi-VN"),
      });
    });

    worksheet.getRow(1).font = { bold: true };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=lich-su-giao-dich-${artifact.code}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("exportArtifactTransactionsExcel error:", err);
    res.status(500).json({ message: "Xuất Excel thất bại" });
  }
}
