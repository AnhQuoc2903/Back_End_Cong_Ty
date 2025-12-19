"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = getCategories;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
exports.searchCategories = searchCategories;
const artifactCategory_model_1 = require("../../models/artifactCategory.model");
async function getCategories(req, res) {
    const categories = await artifactCategory_model_1.ArtifactCategory.find().sort({ name: 1 }).lean();
    res.json(categories);
}
async function createCategory(req, res) {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ message: "Tên danh mục là bắt buộc" });
    }
    const existed = await artifactCategory_model_1.ArtifactCategory.findOne({ name });
    if (existed) {
        return res.status(400).json({ message: "Danh mục này đã tồn tại" });
    }
    const category = await artifactCategory_model_1.ArtifactCategory.create({ name, description });
    res.status(201).json(category);
}
async function updateCategory(req, res) {
    const { id } = req.params;
    const { name, description } = req.body;
    const category = await artifactCategory_model_1.ArtifactCategory.findByIdAndUpdate(id, { name, description }, { new: true });
    if (!category) {
        return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }
    res.json(category);
}
async function deleteCategory(req, res) {
    const { id } = req.params;
    const category = await artifactCategory_model_1.ArtifactCategory.findByIdAndDelete(id);
    if (!category) {
        return res.status(404).json({ message: "Không tìm thấy danh mục" });
    }
    res.json({ message: "Đã xóa danh mục" });
}
async function searchCategories(req, res) {
    const q = req.query.q || "";
    const limit = Math.min(100, Number(req.query.limit) || 50);
    const page = Math.max(1, Number(req.query.page) || 1);
    const filter = q
        ? {
            $or: [{ name: { $regex: q, $options: "i" } }],
        }
        : {};
    const [items, total] = await Promise.all([
        artifactCategory_model_1.ArtifactCategory.find(filter)
            .sort({ name: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        artifactCategory_model_1.ArtifactCategory.countDocuments(filter),
    ]);
    res.json({ data: items, total });
}
