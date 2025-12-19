"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadArtifactImage = uploadArtifactImage;
exports.deleteArtifactImage = deleteArtifactImage;
const cloudinary_1 = __importDefault(require("../../config/cloudinary"));
const artifact_model_1 = require("../../models/artifact.model");
const streamifier_1 = __importDefault(require("streamifier"));
async function uploadArtifactImage(req, res) {
    const artifactId = req.params.id;
    if (!req.file || !req.file.buffer)
        return res
            .status(400)
            .json({ message: "No file uploaded or buffer missing" });
    try {
        const buffer = req.file.buffer;
        const streamUpload = (buffer) => new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.default.uploader.upload_stream({ folder: "artifacts", resource_type: "image" }, (error, result) => {
                if (error) {
                    console.error("Cloudinary upload error:", error);
                    return reject(error);
                }
                resolve(result);
            });
            streamifier_1.default.createReadStream(buffer).pipe(uploadStream);
        });
        const result = await streamUpload(buffer);
        const updated = await artifact_model_1.Artifact.findByIdAndUpdate(artifactId, { imageUrl: result.secure_url, imagePublicId: result.public_id }, { new: true }).populate("category");
        return res.json({
            imageUrl: result.secure_url,
            publicId: result.public_id,
            artifact: updated,
        });
    }
    catch (err) {
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
async function deleteArtifactImage(req, res) {
    const artifactId = req.params.id;
    const artifact = await artifact_model_1.Artifact.findById(artifactId);
    if (!artifact)
        return res.status(404).json({ message: "Artifact not found" });
    try {
        if (artifact.imagePublicId)
            await cloudinary_1.default.uploader.destroy(artifact.imagePublicId);
        artifact.imagePublicId = undefined;
        artifact.imageUrl = undefined;
        await artifact.save();
        return res.json({ message: "Image deleted" });
    }
    catch (err) {
        console.error("Delete image error:", err);
        return res
            .status(500)
            .json({ message: "Delete failed", error: String(err) });
    }
}
