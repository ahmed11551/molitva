import { Router } from "express";
import { prayerDebtController } from "../container";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post("/calculate", asyncHandler(prayerDebtController.calculate));
router.get("/snapshot", asyncHandler(prayerDebtController.snapshot));
router.patch("/progress", asyncHandler(prayerDebtController.updateProgress));
router.get("/report.pdf", asyncHandler(prayerDebtController.report));
router.get("/report/pdf/:jobId", asyncHandler(prayerDebtController.pdfStatus));
router.get("/progress-history", asyncHandler(prayerDebtController.getProgressHistory));
router.post(
  "/calculations",
  asyncHandler(prayerDebtController.enqueueCalculation)
);
router.get(
  "/calculations/:jobId",
  asyncHandler(prayerDebtController.calculationStatus)
);

export default router;


