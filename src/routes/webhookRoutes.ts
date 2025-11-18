import { Router } from "express";
import { webhookController } from "../container";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post(
  "/prayer-debt",
  asyncHandler(webhookController.handle)
);

export default router;


