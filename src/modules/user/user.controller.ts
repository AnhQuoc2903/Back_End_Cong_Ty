import { Request, Response } from "express";
import { User } from "../../models/user.model";
import { hashPassword } from "../../utils/password";

// GET /api/users
export async function getUsers(req: Request, res: Response) {
  const users = await User.find()
    .populate({ path: "roles", populate: { path: "permissions" } })
    .lean();
  res.json(users);
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// POST /api/users
export async function createUser(req: Request, res: Response) {
  const { email, password, fullName, roleIds, isActive } = req.body;
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
    isActive: isActive !== undefined ? isActive : true,
  });

  const full = await User.findById(user._id).populate({
    path: "roles",
    populate: { path: "permissions" },
  });
  res.status(201).json(full);
}

// PATCH /api/users/:id
export async function updateUser(req: Request, res: Response) {
  const { fullName, roleIds, isActive } = req.body;
  const update: any = {};
  if (fullName !== undefined) update.fullName = fullName;
  if (roleIds !== undefined) update.roles = roleIds;
  if (isActive !== undefined) update.isActive = isActive;

  const user = await User.findByIdAndUpdate(req.params.id, update, {
    new: true,
  }).populate({
    path: "roles",
    populate: { path: "permissions" },
  });

  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
}

// DELETE /api/users/:id
export async function deleteUser(req: Request, res: Response) {
  const u = await User.findByIdAndDelete(req.params.id);
  if (!u) return res.status(404).json({ message: "User not found" });
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
