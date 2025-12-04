import { Request, Response } from "express";
import { ArtifactCategory } from "../../models/artifactCategory.model";

export async function getCategories(req: Request, res: Response) {
  const categories = await ArtifactCategory.find().sort({ name: 1 }).lean();
  res.json(categories);
}

export async function createCategory(req: Request, res: Response) {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Tên danh mục là bắt buộc" });
  }

  const existed = await ArtifactCategory.findOne({ name });
  if (existed) {
    return res.status(400).json({ message: "Danh mục này đã tồn tại" });
  }

  const category = await ArtifactCategory.create({ name, description });
  res.status(201).json(category);
}

export async function updateCategory(req: Request, res: Response) {
  const { id } = req.params;
  const { name, description } = req.body;

  const category = await ArtifactCategory.findByIdAndUpdate(
    id,
    { name, description },
    { new: true }
  );

  if (!category) {
    return res.status(404).json({ message: "Không tìm thấy danh mục" });
  }

  res.json(category);
}

export async function deleteCategory(req: Request, res: Response) {
  const { id } = req.params;

  const category = await ArtifactCategory.findByIdAndDelete(id);
  if (!category) {
    return res.status(404).json({ message: "Không tìm thấy danh mục" });
  }

  res.json({ message: "Đã xóa danh mục" });
}

export async function searchCategories(req: Request, res: Response) {
  const q = (req.query.q as string) || "";
  const limit = Math.min(100, Number(req.query.limit) || 50);
  const page = Math.max(1, Number(req.query.page) || 1);

  const filter = q
    ? {
        $or: [{ name: { $regex: q, $options: "i" } }],
      }
    : {};

  const [items, total] = await Promise.all([
    ArtifactCategory.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ArtifactCategory.countDocuments(filter),
  ]);

  res.json({ data: items, total });
}
