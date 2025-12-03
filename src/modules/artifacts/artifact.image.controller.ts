import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import cloudinary from "../../config/cloudinary";
import { Artifact } from "../../models/artifact.model";
import streamifier from "streamifier";

export async function uploadArtifactImage(req: AuthRequest, res: Response) {
  const artifactId = req.params.id;
  if (!req.file || !req.file.buffer)
    return res
      .status(400)
      .json({ message: "No file uploaded or buffer missing" });

  try {
    const buffer = req.file.buffer;
    const streamUpload = (buffer: Buffer) =>
      new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "artifacts", resource_type: "image" },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              return reject(error);
            }
            resolve(result);
          }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
      });

    const result = await streamUpload(buffer);
    const updated = await Artifact.findByIdAndUpdate(
      artifactId,
      { imageUrl: result.secure_url, imagePublicId: result.public_id },
      { new: true }
    ).populate("category");
    return res.json({
      imageUrl: result.secure_url,
      publicId: result.public_id,
      artifact: updated,
    });
  } catch (err: any) {
    console.error("Upload error (full):", err);
    if (err && err.http_code)
      return res
        .status(err.http_code)
        .json({ message: err.message || "Cloudinary error", details: err });
    return res
      .status(500)
      .json({ message: "Upload failed", error: String(err) });
  }
}

export async function deleteArtifactImage(req: AuthRequest, res: Response) {
  const artifactId = req.params.id;
  const artifact = await Artifact.findById(artifactId);
  if (!artifact) return res.status(404).json({ message: "Artifact not found" });

  try {
    if (artifact.imagePublicId)
      await cloudinary.uploader.destroy(artifact.imagePublicId);
    artifact.imagePublicId = undefined as any;
    artifact.imageUrl = undefined as any;
    await artifact.save();
    return res.json({ message: "Image deleted" });
  } catch (err) {
    console.error("Delete image error:", err);
    return res
      .status(500)
      .json({ message: "Delete failed", error: String(err) });
  }
}
