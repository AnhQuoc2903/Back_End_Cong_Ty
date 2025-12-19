"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeImageCloudinary = analyzeImageCloudinary;
const axios_1 = __importDefault(require("axios"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const stream_1 = require("stream");
function uploadBuffer(buffer, options) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.default.uploader.upload_stream(options, (err, result) => {
            if (err)
                return reject(err);
            resolve(result);
        });
        stream_1.Readable.from(buffer).pipe(stream);
    });
}
async function analyzeImageCloudinary(imageUrl) {
    if (!imageUrl)
        throw new Error("imageUrl required");
    let publicId = "";
    let secureUrl = "";
    let resourceInfo = {};
    /**
     * 1) Tải ảnh qua axios → convert sang base64 URI → Cloudinary upload
     */
    try {
        const resp = await axios_1.default.get(imageUrl, {
            responseType: "arraybuffer",
            timeout: 15000,
            headers: {
                "User-Agent": "Artifact-Manager/1.0",
                Accept: "image/*,*/*;q=0.8",
            },
            maxContentLength: 25 * 1024 * 1024,
        });
        const contentType = String(resp.headers["content-type"] || "").toLowerCase();
        if (!contentType.startsWith("image/")) {
            throw new Error("Downloaded resource is not an image");
        }
        const base64 = Buffer.from(resp.data).toString("base64");
        const dataUri = `data:${contentType};base64,${base64}`;
        const uploadRes = await cloudinary_1.default.uploader.upload(dataUri, {
            folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "artifacts",
            resource_type: "image",
        });
        publicId = uploadRes.public_id;
        secureUrl = uploadRes.secure_url;
    }
    catch (err) {
        /**
         * Fallback – dùng upload fetch nếu axios/base64 fail
         */
        try {
            const fallback = await cloudinary_1.default.uploader.upload(imageUrl, {
                folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "artifacts",
                resource_type: "image",
            });
            publicId = fallback.public_id;
            secureUrl = fallback.secure_url;
        }
        catch (err2) {
            throw new Error("Không thể upload/fetch ảnh lên Cloudinary");
        }
    }
    /**
     * Quan trọng: đảm bảo luôn có publicId string
     */
    if (!publicId) {
        throw new Error("Không xác định được public_id");
    }
    /**
     * 2) Lấy resource info từ Cloudinary
     */
    try {
        resourceInfo = await cloudinary_1.default.api.resource(publicId, {
            colors: true,
            image_metadata: true,
        });
    }
    catch (err) {
        console.warn("api.resource failed (continue):", err.message || err);
        resourceInfo = {};
    }
    /**
     * 3) OCR (adv_ocr)
     */
    let ocrTexts = [];
    try {
        const ocrRes = (await cloudinary_1.default.uploader.explicit(publicId, {
            type: "upload",
            ocr: "adv_ocr",
            resource_type: "image",
        }));
        const blocks = ocrRes?.info?.ocr?.adv_ocr?.data;
        if (Array.isArray(blocks)) {
            for (const b of blocks) {
                if (b?.text)
                    ocrTexts.push(b.text);
                if (Array.isArray(b?.words)) {
                    ocrTexts.push(...b.words.map((w) => w.text).filter((t) => Boolean(t)));
                }
            }
        }
    }
    catch (err) {
        console.warn("OCR failed:", err.message || err);
    }
    /**
     * 4) Similar image search (nếu gói Cloudinary không hỗ trợ thì ignore)
     */
    let similarImages = [];
    try {
        const searchRes = await cloudinary_1.default.search
            .expression(`similar:${publicId}`)
            .max_results(12)
            .execute();
        similarImages = (searchRes?.resources || [])
            .map((r) => r.secure_url)
            .filter(Boolean);
    }
    catch (err) {
        similarImages = [];
    }
    /**
     * 5) Return unified result
     */
    return {
        publicId,
        imageUrl: secureUrl,
        labels: resourceInfo.tags || [],
        width: resourceInfo.width,
        height: resourceInfo.height,
        format: resourceInfo.format,
        bytes: resourceInfo.bytes,
        colors: resourceInfo.colors || [],
        metadata: resourceInfo.image_metadata || {},
        texts: ocrTexts,
        similarImages,
        similarSupported: similarImages.length > 0,
        // ensure these exist (frontend expects them)
        entities: [], // currently empty — you can populate if you add web entity extraction later
        pages: [], // currently empty — you can populate if you add page extraction later
    };
}
