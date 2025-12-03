import vision from "@google-cloud/vision";

// Yêu cầu biến môi trường GOOGLE_APPLICATION_CREDENTIALS trỏ tới file JSON
const client = new vision.ImageAnnotatorClient();

export async function analyzeArtifactImage(imageUrl: string) {
  // imageUrl là link public, Vision sẽ tải trực tiếp
  const [result] = await client.annotateImage({
    image: {
      source: { imageUri: imageUrl },
    },
    features: [
      { type: "LABEL_DETECTION", maxResults: 10 },
      { type: "WEB_DETECTION", maxResults: 5 },
      { type: "TEXT_DETECTION" },
    ],
  });

  const labels = result.labelAnnotations?.map((l) => l.description) || [];
  const webEntities =
    result.webDetection?.webEntities?.map((e) => e.description) || [];
  const webPages =
    result.webDetection?.pagesWithMatchingImages?.map((p) => ({
      url: p.url,
      title: p.pageTitle,
    })) || [];
  const texts = result.textAnnotations?.map((t) => t.description) || [];

  return { labels, webEntities, webPages, texts };
}
