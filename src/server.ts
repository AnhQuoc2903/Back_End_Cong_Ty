import dotenv from "dotenv";
dotenv.config();

// 👇 IMPORT NÀY ĐỂ ĐĂNG KÝ TẤT CẢ CÁC MODEL VỚI MONGOOSE
import "./models";

import app from "./app";
import { connectDB } from "./config/db";

const port = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
});
