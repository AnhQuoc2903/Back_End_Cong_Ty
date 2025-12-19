"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoles = getRoles;
exports.createRole = createRole;
exports.updateRole = updateRole;
exports.deleteRole = deleteRole;
exports.getPermissions = getPermissions;
exports.searchRoles = searchRoles;
const role_model_1 = require("../../models/role.model");
const permission_model_1 = require("../../models/permission.model");
async function getRoles(req, res) {
    const roles = await role_model_1.Role.find().populate("permissions").lean();
    res.json(roles);
}
async function createRole(req, res) {
    const { name, description, permissionIds } = req.body;
    if (!name)
        return res.status(400).json({ message: "name required" });
    const role = await role_model_1.Role.create({
        name,
        description,
        permissions: permissionIds || [],
    });
    const full = await role_model_1.Role.findById(role._id).populate("permissions");
    res.status(201).json(full);
}
async function updateRole(req, res) {
    const { name, description, permissionIds } = req.body;
    const role = await role_model_1.Role.findByIdAndUpdate(req.params.id, { name, description, permissions: permissionIds || [] }, { new: true }).populate("permissions");
    if (!role)
        return res.status(404).json({ message: "Role not found" });
    res.json(role);
}
async function deleteRole(req, res) {
    const role = await role_model_1.Role.findByIdAndDelete(req.params.id);
    if (!role)
        return res.status(404).json({ message: "Role not found" });
    res.json({ message: "Deleted" });
}
async function getPermissions(req, res) {
    const perms = await permission_model_1.Permission.find().lean();
    res.json(perms);
}
async function searchRoles(req, res) {
    const q = req.query.q || "";
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const page = Math.max(1, Number(req.query.page) || 1);
    const filter = q
        ? {
            $or: [{ name: { $regex: q, $options: "i" } }],
        }
        : {};
    const [items, total] = await Promise.all([
        role_model_1.Role.find(filter)
            .select("name description permissions")
            .populate("permissions", "name")
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        role_model_1.Role.countDocuments(filter),
    ]);
    res.json({ data: items, total });
}
