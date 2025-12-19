"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchGoogleController = searchGoogleController;
exports.analyzeImage = analyzeImage;
const googleSearch_service_1 = require("../../services/googleSearch.service");
const cloudinaryAi_service_1 = require("../../services/cloudinaryAi.service");
async function searchGoogleController(req, res) {
    const { query } = req.query;
    if (!query || typeof query !== "string") {
        return res.status(400).json({ message: "Thiếu query" });
    }
    try {
        const results = await (0, googleSearch_service_1.searchArtifactOnGoogle)(query);
        res.json(results);
    }
    catch (err) {
        console.error("searchGoogleController error:", err.message);
        res
            .status(500)
            .json({ message: err.message || "Lỗi khi gọi Google Search" });
    }
}
async function analyzeImage(req, res) {
    const { imageUrl } = req.body;
    if (!imageUrl)
        return res.status(400).json({ message: "Thiếu imageUrl" });
    try {
        const result = await (0, cloudinaryAi_service_1.analyzeImageCloudinary)(imageUrl);
        // quick fix: cast to any to avoid TS2339
        const r = result;
        const payload = {
            labels: r.labels ?? [],
            entities: r.entities ?? [], // safe
            similarImages: r.similarImages ?? [],
            pages: r.pages ?? [],
            texts: r.texts ?? [],
            _meta: {
                publicId: r.publicId,
                imageUrl: r.imageUrl,
                similarSupported: r.similarSupported,
            },
        };
        return res.json(payload);
    }
    catch (err) {
        console.error("[AI] Cloudinary analyze error:", err?.message || err);
        return res.status(500).json({
            message: "Cloudinary AI error",
            error: err?.message || String(err),
        });
    }
}
