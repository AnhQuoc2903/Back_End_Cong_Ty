import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import cloudinary from "../../config/cloudinary";
import { Artifact } from "../../models/artifact.model";
import streamifier from "streamifier";
import { io } from "../../server";

export async function uploadArtifactImage(req: AuthRequest, res: Response) {
  const artifactId = req.params.id;

  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  try {
    // ✅ 1️⃣ LẤY ARTIFACT TRƯỚC
    const artifact = await Artifact.findById(artifactId);
    if (!artifact) {
      return res.status(404).json({ message: "Artifact not found" });
    }

    // ✅ 2️⃣ CHECK GIỚI HẠN 5 ẢNH (CHỖ QUAN TRỌNG NHẤT)
    const currentCount = artifact.images?.length ?? 0;
    const uploadCount = req.files.length;

    if (currentCount + uploadCount > 5) {
      return res.status(400).json({
        message: "Mỗi hiện vật chỉ được tối đa 5 ảnh",
      });
    }

    // ✅ 3️⃣ SAU ĐÓ MỚI UPLOAD CLOUDINARY
    const uploadOne = (buffer: Buffer) =>
      new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "artifacts", resource_type: "image" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
      });

    const results = await Promise.all(
      (req.files as Express.Multer.File[]).map((file) => uploadOne(file.buffer))
    );

    const images = results.map((r) => ({
      url: r.secure_url,
      publicId: r.public_id,
    }));

    const updated = await Artifact.findByIdAndUpdate(
      artifactId,
      { $push: { images: { $each: images } } },
      { new: true }
    ).populate("category");

    io.emit("artifact:image:changed", {
      artifactId,
      type: "upload",
    });

    return res.json({ images, artifact: updated });
  } catch (err: any) {
    console.error("Upload error:", err);
    return res.status(500).json({ message: "Upload failed" });
  }
}

export async function deleteArtifactImage(req: AuthRequest, res: Response) {
  const { id, publicId } = req.params;
  const decodedPublicId = decodeURIComponent(publicId);

  try {
    const artifact = await Artifact.findById(id);
    if (!artifact) {
      return res.status(404).json({ message: "Artifact not found" });
    }

    const updated = await Artifact.findByIdAndUpdate(
      id,
      { $pull: { images: { publicId: decodedPublicId } } },
      { new: true }
    );

    await cloudinary.uploader.destroy(decodedPublicId);

    io.emit("artifact:image:changed", {
      artifactId: id,
      type: "delete",
    });

    return res.json({
      message: "Image deleted",
      images: updated?.images,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Delete failed" });
  }
}
