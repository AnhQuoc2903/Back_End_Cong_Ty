import axios from "axios";
import cloudinary from "../config/cloudinary";
import { Readable } from "stream";

type CloudinaryUploadResult = {
  public_id: string;
  secure_url: string;
};

type OCRBlock = { text?: string; words?: { text?: string }[] };
type OCRResult = { data?: OCRBlock[] };

type CloudinaryOCRResponse = {
  info?: {
    ocr?: {
      adv_ocr?: OCRResult;
    };
  };
};

function uploadBuffer(
  buffer: Buffer,
  options: Record<string, any>
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result as CloudinaryUploadResult);
    });

    Readable.from(buffer).pipe(stream);
  });
}

export async function analyzeImageCloudinary(imageUrl: string) {
  if (!imageUrl) throw new Error("imageUrl required");

  let publicId = "";
  let secureUrl = "";
  let resourceInfo: any = {};

  /**
   * 1) Tải ảnh qua axios → convert sang base64 URI → Cloudinary upload
   */
  try {
    const resp = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 15000,
      headers: {
        "User-Agent": "Artifact-Manager/1.0",
        Accept: "image/*,*/*;q=0.8",
      },
      maxContentLength: 25 * 1024 * 1024,
    });

    const contentType = String(
      resp.headers["content-type"] || ""
    ).toLowerCase();
    if (!contentType.startsWith("image/")) {
      throw new Error("Downloaded resource is not an image");
    }

    const base64 = Buffer.from(resp.data).toString("base64");
    const dataUri = `data:${contentType};base64,${base64}`;

    const uploadRes = await cloudinary.uploader.upload(dataUri, {
      folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "artifacts",
      resource_type: "image",
    });

    publicId = uploadRes.public_id;
    secureUrl = uploadRes.secure_url;
  } catch (err) {
    /**
     * Fallback – dùng upload fetch nếu axios/base64 fail
     */
    try {
      const fallback = await cloudinary.uploader.upload(imageUrl, {
        folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "artifacts",
        resource_type: "image",
      });

      publicId = fallback.public_id;
      secureUrl = fallback.secure_url;
    } catch (err2) {
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
    resourceInfo = await cloudinary.api.resource(publicId, {
      colors: true,
      image_metadata: true,
    });
  } catch (err: any) {
    console.warn("api.resource failed (continue):", err.message || err);
    resourceInfo = {};
  }

  /**
   * 3) OCR (adv_ocr)
   */
  let ocrTexts: string[] = [];

  try {
    const ocrRes = (await cloudinary.uploader.explicit(publicId, {
      type: "upload",
      ocr: "adv_ocr",
      resource_type: "image",
    })) as CloudinaryOCRResponse;

    const blocks = ocrRes?.info?.ocr?.adv_ocr?.data;

    if (Array.isArray(blocks)) {
      for (const b of blocks) {
        if (b?.text) ocrTexts.push(b.text);
        if (Array.isArray(b?.words)) {
          ocrTexts.push(
            ...b.words.map((w) => w.text).filter((t): t is string => Boolean(t))
          );
        }
      }
    }
  } catch (err: any) {
    console.warn("OCR failed:", err.message || err);
  }

  /**
   * 4) Similar image search (nếu gói Cloudinary không hỗ trợ thì ignore)
   */
  let similarImages: string[] = [];

  try {
    const searchRes = await cloudinary.search
      .expression(`similar:${publicId}`)
      .max_results(12)
      .execute();

    similarImages = (searchRes?.resources || [])
      .map((r: any) => r.secure_url)
      .filter(Boolean);
  } catch (err: any) {
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
  };
}
