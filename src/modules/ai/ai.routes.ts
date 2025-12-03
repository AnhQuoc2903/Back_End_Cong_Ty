import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { searchGoogleController, analyzeImage } from "./ai.controller";

const router = Router();

router.use(authMiddleware);

router.get("/google-search", searchGoogleController);
router.post("/analyze", analyzeImage);

export default router;
