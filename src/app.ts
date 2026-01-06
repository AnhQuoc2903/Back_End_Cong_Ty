import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import multer from "multer";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/auth.routes";
import artifactRoutes from "./modules/artifacts/artifact.routes";
import categoryRoutes from "./modules/categories/category.routes";
import aiRoutes from "./modules/ai/ai.routes";
import userRoutes from "./modules/user/user.routes";
import roleRoutes from "./modules/roles/role.routes";
import departmentRoutes from "./modules/department/department.routes";

const app = express();

// 🔐 BẮT BUỘC khi dùng HTTPS / cookie secure
app.set("trust proxy", 1);

app.use(helmet());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://font-end-cong-ty.vercel.app",
      "https://www.quan-ly-hien-vat.online",
    ],
    credentials: true,
  })
);

// 🔥 COOKIE PARSER – PHẢI TRƯỚC ROUTES
app.use(cookieParser());

app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

// routes
app.use("/api/auth", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/artifacts", artifactRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/departments", departmentRoutes);

// error handler (để CUỐI)
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Global error handler:", err);
    if (err instanceof multer.MulterError)
      return res.status(400).json({ message: err.message, code: err.code });
    if (err && err.message)
      return res.status(400).json({ message: err.message });
    return res.status(500).json({ message: "Internal server error" });
  }
);

export default app;
