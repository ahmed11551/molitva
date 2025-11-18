import { Router } from "express";
import { prayerCalendarController } from "../container";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(prayerCalendarController.getCalendar));
router.get("/notifications", asyncHandler(prayerCalendarController.getNotifications));

export default router;

