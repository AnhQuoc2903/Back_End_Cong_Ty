import dotenv from "dotenv";
dotenv.config();

import "./models";

import app from "./app";
import { connectDB } from "./config/db";

import http from "http";
import { Server } from "socket.io";

const port = process.env.PORT || 4000;

// 🔥 TẠO HTTP SERVER
const server = http.createServer(app);

// 🔥 KHỞI TẠO SOCKET
export const io = new Server(server, {
  cors: {
    origin: "*", // frontend url nếu muốn giới hạn
  },
});

// 🔥 LẮNG NGHE KẾT NỐI
io.on("connection", (socket) => {
  socket.on("disconnect", () => {});
});

// 🔥 CONNECT DB + START SERVER
connectDB().then(() => {
  server.listen(port, () => {
    console.log(`🚀 Server + Socket running on port ${port}`);
  });
});
