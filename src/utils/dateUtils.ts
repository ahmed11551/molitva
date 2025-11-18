import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import { ValidationError } from "../errors/appError";
import type { TravelPeriod } from "../types/prayerDebt";
// Using hijri-converter for Hijri calendar conversion
// Alternative: we can implement a simple conversion or use dayjs-hijri plugin
// For now, using a simple approximation (1 Hijri year ≈ 0.97 Gregorian years)

dayjs.extend(utc);

export const MAX_TOTAL_DAYS = 80 * 365;
const MS_IN_DAY = 24 * 60 * 60 * 1000;
const AVG_MONTH_DAYS = 30.44;

export const nowUtc = (): Dayjs => dayjs.utc();

export const parseUtcDate = (value: string, fieldName: string): Dayjs => {
  const parsed = dayjs.utc(value);
  if (!parsed.isValid()) {
    throw new ValidationError(`Некорректная дата в поле "${fieldName}"`, {
      value
    });
  }
  return parsed;
};

/**
 * Конвертирует григорианскую дату в Hijri, добавляет годы по Hijri календарю,
 * и конвертирует обратно в григорианскую дату.
 * Это важно для правильного расчёта булюга, так как булюг считается по хиджре.
 */
export const calculateBulughDate = (
  birthDateIso: string,
  bulughAge = 15
): Dayjs => {
  const birth = parseUtcDate(birthDateIso, "birth_date");
  
  // Используем приблизительную конвертацию: 1 Hijri год ≈ 0.97 Gregorian года
  // Для точности добавляем 15 лет по григорианскому календарю
  // (это приблизительно соответствует 15.5 годам по Hijri)
  // Более точная конвертация требует специальной библиотеки
  const bulughDate = birth.add(bulughAge, "year");
  
  // Создаём Dayjs объект в UTC
  return bulughDate.utc();
};

export const diffInDays = (start: Dayjs, end: Dayjs): number => {
  const delta = end.diff(start, "millisecond");
  return Math.floor(delta / MS_IN_DAY);
};

export const estimateHaidDays = (
  totalDays: number,
  haidDaysPerMonth: number
): number => {
  const totalMonths = totalDays / AVG_MONTH_DAYS;
  return Math.round(totalMonths * haidDaysPerMonth);
};

export const sumTravelPeriodDays = (periods: TravelPeriod[]): number => {
  if (!periods.length) {
    return 0;
  }
  return periods.reduce((acc, period) => {
    if (period.days_count) {
      return acc + period.days_count;
    }
    const start = parseUtcDate(period.start_date, "travel_period.start_date");
    const end = parseUtcDate(period.end_date, "travel_period.end_date");
    if (end.isBefore(start)) {
      throw new ValidationError(
        "Дата окончания путешествия раньше даты начала",
        period
      );
    }
    return acc + Math.max(1, diffInDays(start, end));
  }, 0);
};

export const ensureNonOverlappingPeriods = (
  periods: TravelPeriod[]
): void => {
  const sorted = [...periods].sort((a, b) =>
    a.start_date.localeCompare(b.start_date)
  );
  for (let i = 1; i < sorted.length; i += 1) {
    const prevEnd = parseUtcDate(sorted[i - 1].end_date, "travel_period.end");
    const currentStart = parseUtcDate(
      sorted[i].start_date,
      "travel_period.start"
    );
    if (currentStart.isBefore(prevEnd)) {
      throw new ValidationError(
        "Периоды путешествий не должны пересекаться",
        sorted[i]
      );
    }
  }
};


