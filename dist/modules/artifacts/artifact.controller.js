"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArtifacts = getArtifacts;
exports.getArtifact = getArtifact;
exports.createArtifact = createArtifact;
exports.updateArtifact = updateArtifact;
exports.deleteArtifact = deleteArtifact;
exports.importArtifact = importArtifact;
exports.exportArtifact = exportArtifact;
exports.getArtifactTransactions = getArtifactTransactions;
exports.adjustArtifact = adjustArtifact;
const artifact_model_1 = require("../../models/artifact.model");
const artifactTransaction_model_1 = require("../../models/artifactTransaction.model");
async function getArtifacts(req, res) {
    const artifacts = await artifact_model_1.Artifact.find().populate("category").lean();
    res.json(artifacts);
}
async function getArtifact(req, res) {
    const artifact = await artifact_model_1.Artifact.findById(req.params.id)
        .populate("category")
        .lean();
    if (!artifact)
        return res.status(404).json({ message: "Không tìm thấy hiện vật" });
    res.json(artifact);
}
async function createArtifact(req, res) {
    try {
        const { code, name, description, categoryId, location, initialQuantity } = req.body;
        const existed = await artifact_model_1.Artifact.findOne({ code });
        if (existed) {
            return res.status(400).json({
                field: "code",
                message: "Mã hiện vật đã tồn tại",
            });
        }
        const qty = Number(initialQuantity ?? 0);
        if (qty < 0) {
            return res.status(400).json({
                field: "initialQuantity",
                message: "Số lượng ban đầu không hợp lệ",
            });
        }
        const created = await artifact_model_1.Artifact.create({
            code,
            name,
            description,
            category: categoryId || null,
            location,
            status: "bosung",
            quantityCurrent: qty,
        });
        if (qty > 0) {
            await artifactTransaction_model_1.ArtifactTransaction.create({
                artifact: created._id,
                type: "IMPORT",
                quantityChange: qty,
                reason: "Khởi tạo số lượng ban đầu",
                createdBy: req.user?.id,
            });
        }
        const populated = await artifact_model_1.Artifact.findById(created._id).populate("category");
        return res.status(201).json(populated);
    }
    catch (err) {
        console.error("createArtifact error:", err);
        return res.status(500).json({
            message: "Lỗi tạo hiện vật",
        });
    }
}
async function updateArtifact(req, res) {
    const { code, name, description, categoryId, location, status } = req.body;
    const updateData = {};
    const artifactId = req.params.id;
    if (code !== undefined)
        updateData.code = code;
    if (name !== undefined)
        updateData.name = name;
    if (description !== undefined)
        updateData.description = description;
    if (location !== undefined)
        updateData.location = location;
    if (status !== undefined)
        updateData.status = status;
    if (typeof categoryId !== "undefined")
        updateData.category = categoryId || null;
    const existed = await artifact_model_1.Artifact.findOne({ code, _id: { $ne: artifactId } });
    if (existed) {
        return res.status(400).json({
            field: "code",
            message: "Mã hiện vật này đã tồn tại",
        });
    }
    const artifact = await artifact_model_1.Artifact.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
    })
        .populate("category")
        .lean();
    if (!artifact)
        return res.status(404).json({ message: "Không tìm thấy hiện vật" });
    res.json(artifact);
}
async function deleteArtifact(req, res) {
    const artifactId = req.params.id;
    const artifact = await artifact_model_1.Artifact.findById(artifactId);
    if (!artifact)
        return res.status(404).json({ message: "Không tìm thấy hiện vật" });
    // nếu muốn xóa transaction liên quan thì uncomment
    // await ArtifactTransaction.deleteMany({ artifact: artifactId });
    await artifact_model_1.Artifact.findByIdAndDelete(artifactId);
    res.json({ message: "Đã xóa hiện vật" });
}
// import, export, adjust (giữ nguyên logic bạn có)
async function importArtifact(req, res) {
    const { quantity, reason } = req.body;
    const artifactId = req.params.id;
    const tx = await artifactTransaction_model_1.ArtifactTransaction.create({
        artifact: artifactId,
        type: "IMPORT",
        quantityChange: quantity,
        reason,
        createdBy: req.user?.id,
    });
    await artifact_model_1.Artifact.findByIdAndUpdate(artifactId, {
        $inc: { quantityCurrent: quantity },
        status: "bosung",
    });
    res.status(201).json(tx);
}
async function exportArtifact(req, res) {
    const { quantity, reason } = req.body;
    const artifactId = req.params.id;
    const artifact = await artifact_model_1.Artifact.findById(artifactId);
    if (!artifact)
        return res.status(404).json({ message: "Không tìm thấy hiện vật" });
    if (artifact.quantityCurrent < quantity)
        return res.status(400).json({ message: "Không đủ số lượng để xuất" });
    const tx = await artifactTransaction_model_1.ArtifactTransaction.create({
        artifact: artifactId,
        type: "EXPORT",
        quantityChange: -quantity,
        reason,
        createdBy: req.user?.id,
    });
    const newQty = artifact.quantityCurrent - quantity;
    await artifact_model_1.Artifact.findByIdAndUpdate(artifactId, {
        $inc: { quantityCurrent: -quantity },
        status: newQty <= 0 ? "ban" : "con",
    });
    res.status(201).json(tx);
}
async function getArtifactTransactions(req, res) {
    const artifactId = req.params.id;
    const txs = await artifactTransaction_model_1.ArtifactTransaction.find({ artifact: artifactId })
        .sort({ createdAt: -1 })
        .populate("createdBy", "fullName email")
        .lean();
    res.json(txs);
}
async function adjustArtifact(req, res) {
    const { newQuantity, reason } = req.body;
    const artifactId = req.params.id;
    const artifact = await artifact_model_1.Artifact.findById(artifactId);
    if (!artifact)
        return res.status(404).json({ message: "Không tìm thấy hiện vật" });
    const oldQty = artifact.quantityCurrent;
    const diff = newQuantity - oldQty;
    if (diff === 0)
        return res.status(400).json({ message: "Số lượng không thay đổi" });
    const tx = await artifactTransaction_model_1.ArtifactTransaction.create({
        artifact: artifactId,
        type: "ADJUST",
        quantityChange: diff,
        reason,
        createdBy: req.user?.id,
    });
    await artifact_model_1.Artifact.findByIdAndUpdate(artifactId, {
        quantityCurrent: newQuantity,
        status: newQuantity <= 0 ? "ban" : "con",
    });
    res.status(201).json(tx);
}
