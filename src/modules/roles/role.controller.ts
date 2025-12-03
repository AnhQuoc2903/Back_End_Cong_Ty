import { Request, Response } from "express";
import { Role } from "../../models/role.model";
import { Permission } from "../../models/permission.model";

export async function getRoles(req: Request, res: Response) {
  const roles = await Role.find().populate("permissions").lean();
  res.json(roles);
}

export async function createRole(req: Request, res: Response) {
  const { name, description, permissionIds } = req.body;
  if (!name) return res.status(400).json({ message: "name required" });
  const role = await Role.create({
    name,
    description,
    permissions: permissionIds || [],
  });
  const full = await Role.findById(role._id).populate("permissions");
  res.status(201).json(full);
}

export async function updateRole(req: Request, res: Response) {
  const { name, description, permissionIds } = req.body;
  const role = await Role.findByIdAndUpdate(
    req.params.id,
    { name, description, permissions: permissionIds || [] },
    { new: true }
  ).populate("permissions");
  if (!role) return res.status(404).json({ message: "Role not found" });
  res.json(role);
}

export async function deleteRole(req: Request, res: Response) {
  const role = await Role.findByIdAndDelete(req.params.id);
  if (!role) return res.status(404).json({ message: "Role not found" });
  res.json({ message: "Deleted" });
}

export async function getPermissions(req: Request, res: Response) {
  const perms = await Permission.find().lean();
  res.json(perms);
}
