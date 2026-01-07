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

import { exportArtifactsExcel } from "./artifact.export.controller";

import { exportArtifactTransactionsExcel } from "./artifact.export.controller.transaction";

const router = Router();

router.use(authMiddleware);

router.get(
  "/export/excel",
  requirePermission("EXPORT_LIST_OF__ARTIFACT"),
  exportArtifactsExcel
);

router.get(
  "/:id/transactions/export-excel",
  requirePermission("EXPORT_ARTIFACT_TRANSACTIONS"),
  exportArtifactTransactionsExcel
);

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
  "/:id/images",
  requirePermission("EDIT_ARTIFACT"),
  upload.array("files", 5),
  uploadArtifactImage
);

router.delete(
  "/:id/images/:publicId",
  requirePermission("EDIT_ARTIFACT"),
  deleteArtifactImage
);

export default router;
