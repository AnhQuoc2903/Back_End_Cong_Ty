import axios from "axios";

const GOOGLE_SEARCH_URL = "https://www.googleapis.com/customsearch/v1";

const apiKey = process.env.GOOGLE_SEARCH_API_KEY!;
const cx = process.env.GOOGLE_SEARCH_CX!;

export async function searchArtifactOnGoogle(query: string) {
  if (!apiKey || !cx) {
    throw new Error("Google Search API chưa được cấu hình");
  }

  try {
    const res = await axios.get(GOOGLE_SEARCH_URL, {
      params: {
        key: apiKey,
        cx,
        q: query,
        searchType: "image",
        num: 10,
      },
    });

    const items = res.data.items || [];

    return items.map((item: any) => ({
      title: item.title,
      snippet: item.snippet,
      imageUrl: item.link,
      contextLink: item.image.contextLink,
    }));
  } catch (err: any) {
    console.error("Google API error:", err.response?.data || err.message);
    throw new Error(
      err.response?.data?.error?.message || "Lỗi khi gọi Google Search"
    );
  }
}
