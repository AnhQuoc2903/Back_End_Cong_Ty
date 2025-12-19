"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.searchUsers = searchUsers;
const user_model_1 = require("../../models/user.model");
const password_1 = require("../../utils/password");
// GET /api/users
async function getUsers(req, res) {
    const users = await user_model_1.User.find()
        .populate({ path: "roles", populate: { path: "permissions" } })
        .lean();
    res.json(users);
}
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
// POST /api/users
async function createUser(req, res) {
    const { email, password, fullName, roleIds, isActive } = req.body;
    if (!email || !password)
        return res.status(400).json({ message: "email & password required" });
    if (!PASSWORD_REGEX.test(password)) {
        return res.status(400).json({
            message: "Mật khẩu phải ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số",
        });
    }
    const exists = await user_model_1.User.findOne({ email });
    if (exists)
        return res.status(400).json({ message: "Email existed" });
    const passwordHash = await (0, password_1.hashPassword)(password);
    const user = await user_model_1.User.create({
        email,
        passwordHash,
        fullName,
        roles: roleIds || [],
        isActive: isActive !== undefined ? isActive : true,
    });
    const full = await user_model_1.User.findById(user._id).populate({
        path: "roles",
        populate: { path: "permissions" },
    });
    res.status(201).json(full);
}
// PATCH /api/users/:id
async function updateUser(req, res) {
    const { fullName, roleIds, isActive } = req.body;
    const update = {};
    if (fullName !== undefined)
        update.fullName = fullName;
    if (roleIds !== undefined)
        update.roles = roleIds;
    if (isActive !== undefined)
        update.isActive = isActive;
    const user = await user_model_1.User.findByIdAndUpdate(req.params.id, update, {
        new: true,
    }).populate({
        path: "roles",
        populate: { path: "permissions" },
    });
    if (!user)
        return res.status(404).json({ message: "User not found" });
    res.json(user);
}
// DELETE /api/users/:id
async function deleteUser(req, res) {
    const u = await user_model_1.User.findByIdAndDelete(req.params.id);
    if (!u)
        return res.status(404).json({ message: "User not found" });
    res.json({ message: "Deleted" });
}
async function searchUsers(req, res) {
    const q = req.query.q || "";
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
        user_model_1.User.find(filter)
            .select("email fullName roles isActive")
            .populate("roles", "name")
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        user_model_1.User.countDocuments(filter),
    ]);
    res.json({ data: items, total });
}
