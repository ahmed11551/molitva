import { Request, Response } from "express";
import { PrayerCalendarService } from "../services/prayerCalendarService";
import { PrayerDebtService } from "../services/prayerDebtService";
import { asyncHandler } from "../utils/asyncHandler";
import { NotFoundError } from "../errors/appError";

export class PrayerCalendarController {
  constructor(
    private readonly calendarService: PrayerCalendarService,
    private readonly prayerDebtService: PrayerDebtService
  ) {}

  extractUserId = (req: Request): string => {
    const userId = req.header("x-user-id") || (req.query.user_id as string);
    if (!userId) {
      throw new Error("user_id required in header x-user-id or query param");
    }
    return userId;
  };

  /**
   * GET /api/prayer-calendar
   * Получает календарь намазов с напоминаниями о каза-намазах
   */
  getCalendar = asyncHandler(async (req: Request, res: Response) => {
    const userId = this.extractUserId(req);
    const daysAhead = parseInt(req.query.days as string) || 30;

    const debt = await this.prayerDebtService.getSnapshot(userId);
    if (!debt) {
      throw new NotFoundError("Расчёт не выполнен. Сначала выполните расчёт долга.");
    }

    const calendar = await this.calendarService.generateCalendar(debt, daysAhead);

    res.json({
      calendar,
      total_days: calendar.length,
      total_kaza_reminders: calendar.reduce((sum, day) => sum + day.kazaCount, 0),
    });
  });

  /**
   * GET /api/prayer-calendar/notifications
   * Получает уведомления для интеграции с внешними системами
   */
  getNotifications = asyncHandler(async (req: Request, res: Response) => {
    const userId = this.extractUserId(req);

    const debt = await this.prayerDebtService.getSnapshot(userId);
    if (!debt) {
      throw new NotFoundError("Расчёт не выполнен. Сначала выполните расчёт долга.");
    }

    const notifications = await this.calendarService.generateNotifications(debt, userId);

    res.json({
      notifications,
      total: notifications.length,
    });
  });
}

