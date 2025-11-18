import { Router } from "express";
import { aiController } from "../container";

const router = Router();

router.get("/repayment-plan", (req, res) => aiController.getRepaymentPlan(req, res));
router.get("/motivational-message", (req, res) => aiController.getMotivationalMessage(req, res));
router.get("/prayer-patterns", (req, res) => aiController.getPrayerPatterns(req, res));

export default router;

