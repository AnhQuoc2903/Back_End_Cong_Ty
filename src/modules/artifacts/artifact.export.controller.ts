import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { Artifact } from "../../models/artifact.model";
import ExcelJS from "exceljs";

type ArtifactExport = {
  code: string;
  name: string;
  location?: string;
  quantityCurrent?: number;
  status?: string;
  createdAt: Date;
  category?: {
    name?: string;
  } | null;
};

export async function exportArtifactsExcel(req: AuthRequest, res: Response) {
  try {
    const artifacts = (await Artifact.find()
      .populate("category", "name")
      .lean()) as ArtifactExport[];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Danh sách hiện vật");

    worksheet.columns = [
      { header: "Mã hiện vật", key: "code", width: 20 },
      { header: "Tên hiện vật", key: "name", width: 30 },
      { header: "Danh mục", key: "category", width: 25 },
      { header: "Vị trí", key: "location", width: 20 },
      { header: "Tồn kho", key: "quantity", width: 12 },
      { header: "Trạng thái", key: "status", width: 15 },
      { header: "Ngày tạo", key: "createdAt", width: 22 },
    ];

    worksheet.getRow(1).font = { bold: true };

    artifacts.forEach((a) => {
      worksheet.addRow({
        code: a.code,
        name: a.name,
        category: a.category?.name ?? "",
        location: a.location ?? "",
        quantity: a.quantityCurrent ?? 0,
        status:
          a.status === "bosung"
            ? "Mới bổ sung"
            : a.status === "con"
            ? "Còn hàng"
            : "Hết hàng",
        createdAt: new Date(a.createdAt).toLocaleString("vi-VN"),
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="artifacts.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Xuất Excel thất bại" });
  }
}
