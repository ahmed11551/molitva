import { Router } from "express";
import { glossaryController } from "../container";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(glossaryController.getGlossary));
router.get("/:term", asyncHandler(glossaryController.getTerm));

export default router;

