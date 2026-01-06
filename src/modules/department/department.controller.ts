import { Request, Response } from "express";
import { Department } from "../../models/department.model";
import { User } from "../../models/user.model";

/**
 * GET /api/departments
 * 👉 Admin: lấy TẤT CẢ (kể cả inactive)
 */
export async function getDepartments(req: Request, res: Response) {
  const departments = await Department.find().sort({ name: 1 }).lean();
  res.json(departments);
}

/**
 * GET /api/departments/active
 * 👉 Dropdown / UserForm
 */
export async function getActiveDepartments(req: Request, res: Response) {
  const departments = await Department.find({ isActive: true })
    .sort({ name: 1 })
    .lean();
  res.json(departments);
}

/**
 * POST /api/departments
 */
export async function createDepartment(req: Request, res: Response) {
  const { name } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({
      message: "Tên phòng ban là bắt buộc",
    });
  }

  const existed = await Department.findOne({
    name: name.trim(),
  });

  if (existed) {
    return res.status(400).json({
      message: "Phòng ban đã tồn tại",
    });
  }

  const department = await Department.create({
    name: name.trim(),
  });

  res.status(201).json(department);
}

/**
 * PATCH /api/departments/:id
 * 👉 đổi tên / bật tắt
 */
export async function updateDepartment(req: Request, res: Response) {
  const { name, isActive } = req.body;

  const update: any = {};
  if (name !== undefined) update.name = name.trim();
  if (isActive !== undefined) update.isActive = isActive;

  const department = await Department.findByIdAndUpdate(req.params.id, update, {
    new: true,
  });

  if (!department) {
    return res.status(404).json({
      message: "Không tìm thấy phòng ban",
    });
  }

  res.json(department);
}

/**
 * PATCH /api/departments/:id/disable
 * 👉 Disable an toàn (khuyến nghị)
 */
export async function disableDepartment(req: Request, res: Response) {
  const department = await Department.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!department) {
    return res.status(404).json({
      message: "Không tìm thấy phòng ban",
    });
  }

  res.json(department);
}

/**
 * DELETE /api/departments/:id
 * ❗ CHỈ cho xóa nếu CHƯA CÓ USER
 */
export async function deleteDepartment(req: Request, res: Response) {
  const userCount = await User.countDocuments({
    department: req.params.id,
  });

  if (userCount > 0) {
    return res.status(400).json({
      message: `Không thể xóa. Phòng ban đang có ${userCount} người dùng`,
    });
  }

  const deleted = await Department.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({
      message: "Không tìm thấy phòng ban",
    });
  }

  res.json({ message: "Đã xóa phòng ban" });
}
