import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { Artifact } from "../../models/artifact.model";
import { ArtifactTransaction } from "../../models/artifactTransaction.model";
import cloudinary from "../../config/cloudinary";
import { io } from "../../server";

export async function getArtifacts(req: AuthRequest, res: Response) {
  const artifacts = await Artifact.find()
    .populate("category")
    .sort({ createdAt: -1 }) // ✅ mới nhất lên đầu
    .lean();

  res.json(artifacts);
}

export async function getArtifact(req: AuthRequest, res: Response) {
  const artifact = await Artifact.findById(req.params.id)
    .populate("category")
    .lean();
  if (!artifact)
    return res.status(404).json({ message: "Không tìm thấy hiện vật" });
  res.json(artifact);
}

export async function createArtifact(req: AuthRequest, res: Response) {
  try {
    const { code, name, description, categoryId, location, initialQuantity } =
      req.body;

    const existed = await Artifact.findOne({ code });
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

    const created = await Artifact.create({
      code,
      name,
      description,
      category: categoryId || null,
      location,
      status: "bosung",
      quantityCurrent: qty,
      images: [],
    });

    if (qty > 0) {
      await ArtifactTransaction.create({
        artifact: created._id,
        type: "IMPORT",
        quantityChange: qty,
        reason: "Khởi tạo số lượng ban đầu",
        createdBy: req.user?.id,
      });
    }

    const populated = await Artifact.findById(created._id).populate("category");

    io.emit("artifact:changed");

    return res.status(201).json(populated);
  } catch (err: any) {
    console.error("createArtifact error:", err);
    return res.status(500).json({
      message: "Lỗi tạo hiện vật",
    });
  }
}

export async function updateArtifact(req: AuthRequest, res: Response) {
  const { code, name, description, categoryId, location, status } = req.body;
  const updateData: any = {};
  const artifactId = req.params.id;
  if (code !== undefined) updateData.code = code;
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (location !== undefined) updateData.location = location;
  if (status !== undefined) updateData.status = status;
  if (typeof categoryId !== "undefined")
    updateData.category = categoryId || null;

  if (code !== undefined) {
    const existed = await Artifact.findOne({
      code,
      _id: { $ne: artifactId },
    });
    if (existed) {
      return res.status(400).json({
        field: "code",
        message: "Mã hiện vật này đã tồn tại",
      });
    }
  }

  const artifact = await Artifact.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
  })
    .populate("category")
    .lean();
  if (!artifact)
    return res.status(404).json({ message: "Không tìm thấy hiện vật" });
  io.emit("artifact:changed");
  res.json(artifact);
}

export async function deleteArtifact(req: AuthRequest, res: Response) {
  const artifactId = req.params.id;
  const artifact = await Artifact.findById(artifactId);
  if (!artifact)
    return res.status(404).json({ message: "Không tìm thấy hiện vật" });

  // ✅ xóa tất cả ảnh cloudinary
  if (artifact.images?.length) {
    await Promise.allSettled(
      artifact.images.map((img: any) =>
        cloudinary.uploader.destroy(img.publicId)
      )
    );
  }

  await Artifact.findByIdAndDelete(artifactId);

  io.emit("artifact:changed");

  res.json({ message: "Đã xóa hiện vật" });
}

// import, export, adjust (giữ nguyên logic bạn có)
export async function importArtifact(req: AuthRequest, res: Response) {
  const { quantity, reason } = req.body;
  const artifactId = req.params.id;
  const tx = await ArtifactTransaction.create({
    artifact: artifactId,
    type: "IMPORT",
    quantityChange: quantity,
    reason,
    createdBy: req.user?.id,
  });
  await Artifact.findByIdAndUpdate(artifactId, {
    $inc: { quantityCurrent: quantity },
    status: "bosung",
  });
  io.emit("artifact:changed");
  res.status(201).json(tx);
}

export async function exportArtifact(req: AuthRequest, res: Response) {
  const { quantity, reason } = req.body;
  const artifactId = req.params.id;
  const artifact = await Artifact.findById(artifactId);
  if (!artifact)
    return res.status(404).json({ message: "Không tìm thấy hiện vật" });
  if (artifact.quantityCurrent < quantity)
    return res.status(400).json({ message: "Không đủ số lượng để xuất" });

  const tx = await ArtifactTransaction.create({
    artifact: artifactId,
    type: "EXPORT",
    quantityChange: -quantity,
    reason,
    createdBy: req.user?.id,
  });
  const newQty = artifact.quantityCurrent - quantity;
  await Artifact.findByIdAndUpdate(artifactId, {
    $inc: { quantityCurrent: -quantity },
    status: newQty <= 0 ? "ban" : "con",
  });
  io.emit("artifact:changed");
  res.status(201).json(tx);
}

export async function getArtifactTransactions(req: AuthRequest, res: Response) {
  const artifactId = req.params.id;
  const txs = await ArtifactTransaction.find({ artifact: artifactId })
    .sort({ createdAt: -1 })
    .populate("createdBy", "fullName email")
    .lean();
  res.json(txs);
}

export async function adjustArtifact(req: AuthRequest, res: Response) {
  const { newQuantity, reason } = req.body;
  const artifactId = req.params.id;
  const artifact = await Artifact.findById(artifactId);
  if (!artifact)
    return res.status(404).json({ message: "Không tìm thấy hiện vật" });

  const oldQty = artifact.quantityCurrent;
  const diff = newQuantity - oldQty;
  if (diff === 0)
    return res.status(400).json({ message: "Số lượng không thay đổi" });

  const tx = await ArtifactTransaction.create({
    artifact: artifactId,
    type: "ADJUST",
    quantityChange: diff,
    reason,
    createdBy: req.user?.id,
  });

  await Artifact.findByIdAndUpdate(artifactId, {
    quantityCurrent: newQuantity,
    status: newQuantity <= 0 ? "ban" : "con",
  });
  res.status(201).json(tx);
}
