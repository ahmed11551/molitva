import type { UserPrayerDebt } from "../types/prayerDebt";
import { logger } from "../utils/logger";
import { nowUtc } from "../utils/dateUtils";
import dayjs from "dayjs";

export interface PrayerTime {
  prayer: "fajr" | "dhuhr" | "asr" | "maghrib" | "isha" | "witr";
  time: string; // ISO date
  isKaza: boolean; // Является ли это каза-намазом
  reminder?: string;
}

export interface CalendarDay {
  date: string; // ISO date
  prayers: PrayerTime[];
  kazaCount: number;
}

export class PrayerCalendarService {
  /**
   * Генерирует календарь намазов с напоминаниями о каза-намазах
   * на основе текущего долга пользователя
   */
  async generateCalendar(
    debt: UserPrayerDebt,
    daysAhead: number = 30
  ): Promise<CalendarDay[]> {
    const { missed_prayers, completed_prayers } = debt.debt_calculation;
    const calendar: CalendarDay[] = [];
    const startDate = nowUtc();

    // Рассчитываем, сколько каза-намазов нужно делать в день
    const totalRemaining = Object.entries(missed_prayers).reduce(
      (sum, [key, total]) => {
        const completed = completed_prayers[key as keyof typeof completed_prayers] || 0;
        return sum + (total - completed);
      },
      0
    );

    const dailyKazaTarget = Math.ceil(totalRemaining / daysAhead);

    for (let i = 0; i < daysAhead; i++) {
      const date = startDate.add(i, "day");
      const prayers: PrayerTime[] = [
        {
          prayer: "fajr",
          time: date.hour(5).minute(30).toISOString(), // Примерное время
          isKaza: this.shouldIncludeKaza("fajr", missed_prayers, completed_prayers),
        },
        {
          prayer: "dhuhr",
          time: date.hour(12).minute(30).toISOString(),
          isKaza: this.shouldIncludeKaza("dhuhr", missed_prayers, completed_prayers),
        },
        {
          prayer: "asr",
          time: date.hour(15).minute(30).toISOString(),
          isKaza: this.shouldIncludeKaza("asr", missed_prayers, completed_prayers),
        },
        {
          prayer: "maghrib",
          time: date.hour(18).minute(30).toISOString(),
          isKaza: this.shouldIncludeKaza("maghrib", missed_prayers, completed_prayers),
        },
        {
          prayer: "isha",
          time: date.hour(20).minute(0).toISOString(),
          isKaza: this.shouldIncludeKaza("isha", missed_prayers, completed_prayers),
        },
      ];

      // Добавляем витр только для ханафитского мазхаба
      if (debt.madhab === "hanafi") {
        prayers.push({
          prayer: "witr",
          time: date.hour(20).minute(30).toISOString(),
          isKaza: this.shouldIncludeKaza("witr", missed_prayers, completed_prayers),
        });
      }

      // Добавляем напоминания для каза-намазов
      const kazaPrayers = prayers.filter((p) => p.isKaza);
      if (kazaPrayers.length > 0) {
        kazaPrayers.forEach((prayer) => {
          prayer.reminder = `Не забудьте восполнить ${this.getPrayerName(prayer.prayer)}`;
        });
      }

      calendar.push({
        date: date.toISOString(),
        prayers,
        kazaCount: kazaPrayers.length,
      });
    }

    return calendar;
  }

  /**
   * Проверяет, нужно ли включать каза-намаз для данного типа
   */
  private shouldIncludeKaza(
    prayerType: string,
    missed: UserPrayerDebt["debt_calculation"]["missed_prayers"],
    completed: UserPrayerDebt["debt_calculation"]["completed_prayers"]
  ): boolean {
    const total = missed[prayerType as keyof typeof missed] || 0;
    const completedCount = completed[prayerType as keyof typeof completed] || 0;
    return total > completedCount;
  }

  /**
   * Получает название намаза
   */
  private getPrayerName(prayer: string): string {
    const names: Record<string, string> = {
      fajr: "Фаджр",
      dhuhr: "Зухр",
      asr: "Аср",
      maghrib: "Магриб",
      isha: "Иша",
      witr: "Витр",
    };
    return names[prayer] || prayer;
  }

  /**
   * Генерирует уведомления для Telegram (если интегрирован)
   */
  async generateNotifications(
    debt: UserPrayerDebt,
    userId: string
  ): Promise<Array<{ time: string; message: string }>> {
    const calendar = await this.generateCalendar(debt, 7); // На неделю вперёд
    const notifications: Array<{ time: string; message: string }> = [];

    calendar.forEach((day) => {
      day.prayers.forEach((prayer) => {
        if (prayer.isKaza && prayer.reminder) {
          notifications.push({
            time: prayer.time,
            message: prayer.reminder,
          });
        }
      });
    });

    return notifications;
  }
}

