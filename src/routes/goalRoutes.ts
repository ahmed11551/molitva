import { Router } from "express";
import { goalController } from "../container";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(goalController.getGoals));
router.post("/", asyncHandler(goalController.createGoal));
router.post("/auto-monthly", asyncHandler(goalController.createAutoMonthlyGoal));

export default router;

