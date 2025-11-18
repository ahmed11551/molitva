import { Router } from "express";
import { duaController } from "../container";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get(
  "/categories",
  asyncHandler(duaController.getCategories)
);
router.get("/", asyncHandler(duaController.getDuas));
router.get("/:id", asyncHandler(duaController.getDua));

export default router;


