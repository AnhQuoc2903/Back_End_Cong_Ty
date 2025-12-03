import { Router } from "express";
import { authMiddleware } from "../../middleware/auth";
import { requirePermission } from "../../middleware/rbac";
import {
  getArtifacts,
  getArtifact,
  createArtifact,
  updateArtifact,
  importArtifact,
  exportArtifact,
  adjustArtifact,
  getArtifactTransactions,
  deleteArtifact,
} from "./artifact.controller";
import {
  uploadArtifactImage,
  deleteArtifactImage,
} from "./artifact.image.controller";
import { upload } from "../../middleware/upload";

const router = Router();

router.use(authMiddleware);

router.get("/", requirePermission("VIEW_ARTIFACT"), getArtifacts);
router.get("/:id", requirePermission("VIEW_ARTIFACT"), getArtifact);
router.post("/", requirePermission("CREATE_ARTIFACT"), createArtifact);
router.patch("/:id", requirePermission("EDIT_ARTIFACT"), updateArtifact);

router.post(
  "/:id/import",
  requirePermission("IMPORT_ARTIFACT"),
  importArtifact
);
router.post(
  "/:id/export",
  requirePermission("EXPORT_ARTIFACT"),
  exportArtifact
);
router.post(
  "/:id/adjust",
  requirePermission("ADJUST_ARTIFACT"),
  adjustArtifact
);
router.get(
  "/:id/transactions",
  requirePermission("VIEW_ARTIFACT_TRANSACTIONS"),
  getArtifactTransactions
);
router.delete("/:id", requirePermission("DELETE_ARTIFACT"), deleteArtifact);
router.post(
  "/:id/image",
  requirePermission("EDIT_ARTIFACT"),
  upload.single("file"),
  uploadArtifactImage
);
router.delete(
  "/:id/image",
  requirePermission("EDIT_ARTIFACT"),
  deleteArtifactImage
);

export default router;
