"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchArtifactOnGoogle = searchArtifactOnGoogle;
const axios_1 = __importDefault(require("axios"));
const GOOGLE_SEARCH_URL = "https://www.googleapis.com/customsearch/v1";
const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
const cx = process.env.GOOGLE_SEARCH_CX;
async function searchArtifactOnGoogle(query) {
    if (!apiKey || !cx) {
        throw new Error("Google Search API chưa được cấu hình");
    }
    try {
        const res = await axios_1.default.get(GOOGLE_SEARCH_URL, {
            params: {
                key: apiKey,
                cx,
                q: query,
                searchType: "image",
                num: 10,
            },
        });
        const items = res.data.items || [];
        return items.map((item) => ({
            title: item.title,
            snippet: item.snippet,
            imageUrl: item.link,
            contextLink: item.image.contextLink,
        }));
    }
    catch (err) {
        console.error("Google API error:", err.response?.data || err.message);
        throw new Error(err.response?.data?.error?.message || "Lỗi khi gọi Google Search");
    }
}
