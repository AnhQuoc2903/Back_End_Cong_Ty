import { Router } from "express";
import {
  getMonthlyStats,
  getLowStockArtifacts,
  getDashboardSummary,
  exportDashboardTransactionsExcel,
} from "./dashboard.controller";

const router = Router();

router.get("/monthly-stats", getMonthlyStats);
router.get("/low-stock", getLowStockArtifacts);
router.get("/summary", getDashboardSummary);
router.get("/export-transactions-excel", exportDashboardTransactionsExcel);

export default router;
