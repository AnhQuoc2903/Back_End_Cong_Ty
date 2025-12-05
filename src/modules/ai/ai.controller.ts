import { Request, Response } from "express";
import { searchArtifactOnGoogle } from "../../services/googleSearch.service";
import { analyzeImageCloudinary } from "../../services/cloudinaryAi.service";

export async function searchGoogleController(req: Request, res: Response) {
  const { query } = req.query;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ message: "Thiếu query" });
  }

  try {
    const results = await searchArtifactOnGoogle(query);
    res.json(results);
  } catch (err: any) {
    console.error("searchGoogleController error:", err.message);
    res
      .status(500)
      .json({ message: err.message || "Lỗi khi gọi Google Search" });
  }
}

export async function analyzeImage(req: Request, res: Response) {
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ message: "Thiếu imageUrl" });

  try {
    const result = await analyzeImageCloudinary(imageUrl);

    // quick fix: cast to any to avoid TS2339
    const r = result as any;

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
  } catch (err: any) {
    console.error("[AI] Cloudinary analyze error:", err?.message || err);
    return res.status(500).json({
      message: "Cloudinary AI error",
      error: err?.message || String(err),
    });
  }
}
