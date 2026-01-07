import { Request, Response } from "express";
import { User } from "../../models/user.model";
import { hashPassword } from "../../utils/password";
import { AuthRequest } from "../../middleware/auth";
import { logActivity } from "../../utils/activity-log";
import { Types } from "mongoose";

// GET /api/users
export async function getUsers(req: Request, res: Response) {
  const users = await User.find()
    .populate({ path: "roles", populate: { path: "permissions" } })
    .populate("department")
    .lean();
  res.json(users);
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// POST /api/users
export async function createUser(req: AuthRequest, res: Response) {
  const { email, password, fullName, roleIds, departmentId, isActive } =
    req.body;
  if (!email || !password)
    return res.status(400).json({ message: "email & password required" });

  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      message: "Mật khẩu phải ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số",
    });
  }

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email existed" });

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    email,
    passwordHash,
    fullName,
    roles: roleIds || [],
    department: departmentId || null,
    isActive: isActive !== undefined ? isActive : true,
  });

  const actor = await User.findById(req.user!.id)
    .select("email fullName")
    .lean();

  await logActivity({
    actorId: new Types.ObjectId(req.user!.id),
    actorSnapshot: {
      _id: new Types.ObjectId(req.user!.id),
      email: actor?.email,
      fullName: actor?.fullName,
    },
    action: "CREATE_USER",
    targetType: "User",
    targetId: user._id,
    targetSnapshot: {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
    },

    after: {
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      department: user.department,
      isActive: user.isActive,
    },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  const full = await User.findById(user._id).populate({
    path: "roles",
    populate: { path: "permissions" },
  });
  res.status(201).json(full);
}

// PATCH /api/users/:id
// PATCH /api/users/:id
export async function updateUser(req: AuthRequest, res: Response) {
  const { fullName, roleIds, departmentId, isActive } = req.body;

  const update: any = {};
  if (fullName !== undefined) update.fullName = fullName;
  if (roleIds !== undefined) update.roles = roleIds;
  if (departmentId !== undefined) update.department = departmentId;
  if (isActive !== undefined) update.isActive = isActive;

  // ===== USER TRƯỚC =====
  const beforeUser = await User.findById(req.params.id)
    .populate("roles", "name")
    .populate("department", "name")
    .lean();

  if (!beforeUser) {
    return res.status(404).json({ message: "User not found" });
  }

  // ===== UPDATE =====
  const updatedUser = await User.findByIdAndUpdate(req.params.id, update, {
    new: true,
  })
    .populate("roles", "name")
    .populate("department", "name")
    .lean();

  if (!updatedUser) {
    return res.status(404).json({ message: "User not found" });
  }

  // ===== SO SÁNH =====
  const beforeLog: any = {};
  const afterLog: any = {};

  // HỌ TÊN
  if (beforeUser.fullName !== updatedUser.fullName) {
    beforeLog.fullName = beforeUser.fullName || "(Trống)";
    afterLog.fullName = updatedUser.fullName || "(Trống)";
  }

  // TRẠNG THÁI
  if (beforeUser.isActive !== updatedUser.isActive) {
    beforeLog.isActive = beforeUser.isActive ? "Hoạt động" : "Ngưng hoạt động";
    afterLog.isActive = updatedUser.isActive ? "Hoạt động" : "Ngưng hoạt động";
  }

  // ROLE
  const beforeRoles = (beforeUser.roles as any[]).map((r) => r.name).join(", ");
  const afterRoles = (updatedUser.roles as any[]).map((r) => r.name).join(", ");

  if (beforeRoles !== afterRoles) {
    beforeLog.roles = beforeRoles || "(Không có)";
    afterLog.roles = afterRoles || "(Không có)";
  }

  // PHÒNG BAN
  const beforeDept = (beforeUser.department as any)?.name || "(Không có)";
  const afterDept = (updatedUser.department as any)?.name || "(Không có)";

  if (beforeDept !== afterDept) {
    beforeLog.department = beforeDept;
    afterLog.department = afterDept;
  }

  // ===== LOG =====
  if (Object.keys(beforeLog).length > 0) {
    const actor = await User.findById(req.user!.id)
      .select("email fullName")
      .lean();

    await logActivity({
      actorId: new Types.ObjectId(req.user!.id),
      actorSnapshot: {
        _id: new Types.ObjectId(req.user!.id),
        email: actor?.email,
        fullName: actor?.fullName,
      },
      action: "UPDATE_USER",
      targetType: "User",
      targetId: updatedUser._id,
      targetSnapshot: {
        _id: updatedUser._id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
      },
      before: beforeLog,
      after: afterLog,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  res.json(updatedUser);
}

// DELETE /api/users/:id
export async function deleteUser(req: AuthRequest, res: Response) {
  const before = await User.findById(req.params.id).lean();
  if (!before) return res.status(404).json({ message: "User not found" });

  const actor = await User.findById(req.user!.id)
    .select("email fullName")
    .lean();

  await User.findByIdAndDelete(req.params.id);

  await logActivity({
    actorId: new Types.ObjectId(req.user!.id),
    actorSnapshot: {
      _id: new Types.ObjectId(req.user!.id),
      email: actor?.email,
      fullName: actor?.fullName,
    },
    action: "DELETE_USER",
    targetType: "User",
    targetId: before._id,
    targetSnapshot: {
      // 🔥 QUAN TRỌNG NHẤT
      _id: before._id,
      email: before.email,
      fullName: before.fullName,
    },
    before: {
      email: before.email,
      fullName: before.fullName,
    },
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.json({ message: "Deleted" });
}

export async function searchUsers(req: Request, res: Response) {
  const q = (req.query.q as string) || "";
  const limit = Math.min(100, Number(req.query.limit) || 50);
  const page = Math.max(1, Number(req.query.page) || 1);

  const filter = q
    ? {
        $or: [
          { email: { $regex: q, $options: "i" } },
          { fullName: { $regex: q, $options: "i" } },
          // { $text: { $search: q } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    User.find(filter)
      .select("email fullName roles isActive")
      .populate("roles", "name")
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({ data: items, total });
}
