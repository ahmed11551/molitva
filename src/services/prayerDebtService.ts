import { v4 as uuid } from "uuid";
import type {
  CalculationInput,
  CalculationJob,
  MissedPrayers,
  PersonalData,
  ProgressEntry,
  RepaymentProgress,
  TravelData,
  TravelPrayers,
  UserPrayerDebt,
  WomenData,
  Madhab
} from "../types/prayerDebt";
import { PrayerDebtRepository } from "../repositories/prayerDebtRepository";
import { AppConfig } from "../config";
import {
  calculateBulughDate,
  diffInDays,
  ensureNonOverlappingPeriods,
  estimateHaidDays,
  MAX_TOTAL_DAYS,
  nowUtc,
  parseUtcDate,
  sumTravelPeriodDays
} from "../utils/dateUtils";
import { NotFoundError, ValidationError } from "../errors/appError";
import { EReplikaClient } from "./eReplikaClient";

const DEFAULT_WOMEN_DATA: WomenData = {
  haid_days_per_month: 7,
  childbirth_count: 0,
  nifas_days_per_childbirth: 40
};

const emptyMissed = (): MissedPrayers => ({
  fajr: 0,
  dhuhr: 0,
  asr: 0,
  maghrib: 0,
  isha: 0,
  witr: 0
});

const emptyTravel = (): TravelPrayers => ({
  dhuhr_safar: 0,
  asr_safar: 0,
  isha_safar: 0
});

export class PrayerDebtService {
  constructor(
    private readonly repository: PrayerDebtRepository,
    private readonly config: AppConfig,
    private readonly eReplikaClient: EReplikaClient
  ) {}

  async calculateDebt(
    userId: string,
    payload: CalculationInput
  ): Promise<UserPrayerDebt> {
    const personal = this.preparePersonalData(payload.personal_data);
    const women =
      personal.gender === "female"
        ? this.prepareWomenData(payload.women_data)
        : undefined;
    const travel = this.prepareTravelData(payload.travel_data);

    const madhab = payload.madhab ?? this.config.madhab;

    const debtCalculation = this.buildDebtCalculation(
      personal,
      women,
      travel,
      madhab
    );

    const previous = await this.repository.findByUserId(userId);
    const baseProgress =
      previous && previous.madhab === madhab
        ? previous.repayment_progress
        : this.createEmptyProgress();

    const snapshot: UserPrayerDebt = {
      user_id: userId,
      calc_version: this.config.calcVersion,
      madhab,
      calculation_method: payload.calculation_method,
      personal_data: personal,
      women_data: women,
      travel_data: travel,
      debt_calculation: debtCalculation,
      repayment_progress: baseProgress
    };

    return await this.repository.saveDebt(snapshot);
  }

  async getSnapshot(userId: string): Promise<UserPrayerDebt> {
    const debt = await this.repository.findByUserId(userId);
    if (!debt) {
      throw new NotFoundError("Расчёт не найден. Сначала выполните calculate.");
    }
    return debt;
  }

  async updateProgress(
    userId: string,
    entries: ProgressEntry[]
  ): Promise<UserPrayerDebt> {
    const snapshot = await this.getSnapshot(userId);
    const updatedProgress = this.applyProgressEntries(
      snapshot,
      entries
    );
    return await this.repository.updateProgress(userId, updatedProgress);
  }

  async requestPdfReport(userId: string): Promise<{ url: string }> {
    const snapshot = await this.getSnapshot(userId);
    const url = await this.eReplikaClient.requestPdfReport(snapshot);
    
    // Audit log
    const { logAudit, AuditActions, EntityTypes } = await import("../utils/auditLogger");
    await logAudit({
      user_id: userId,
      action: AuditActions.PDF_REQUESTED,
      entity_type: EntityTypes.PRAYER_DEBT,
      entity_id: userId,
      metadata: { pdf_url: url }
    });
    
    return { url };
  }

  async checkPdfStatus(jobId: string): Promise<{ url?: string; status: string }> {
    return await this.eReplikaClient.checkPdfStatus(jobId);
  }

  async enqueueCalculation(
    userId: string,
    payload: CalculationInput
  ): Promise<CalculationJob> {
    const job: CalculationJob = {
      job_id: uuid(),
      user_id: userId,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      payload
    };
    await this.repository.createJob(job);
    await this.eReplikaClient.enqueueCalculation(job, payload);
    return job;
  }

  async getCalculationJob(jobId: string): Promise<CalculationJob> {
    const job = await this.repository.findJob(jobId);
    if (!job) {
      throw new NotFoundError("Job не найден");
    }
    return job;
  }

  async resolveJob(
    jobId: string,
    status: "done" | "error",
    result?: UserPrayerDebt,
    error?: string
  ): Promise<CalculationJob> {
    return await this.repository.updateJob(jobId, (job) => ({
      ...job,
      status,
      result,
      error
    }));
  }

  private preparePersonalData(input: CalculationInput["personal_data"]) {
    const bulughAge = input.bulugh_age ?? 15;
    const bulughDate = calculateBulughDate(input.birth_date, bulughAge);
    const todayFlag =
      input.today_as_start ?? (input.prayer_start_date ? false : true);
    const startDate = todayFlag
      ? nowUtc()
      : parseUtcDate(
          input.prayer_start_date ?? nowUtc().toISOString(),
          "prayer_start_date"
        );

    if (startDate.isBefore(bulughDate)) {
      throw new ValidationError(
        "Дата начала молитв не может быть раньше даты булюга"
      );
    }

    return {
      birth_date: parseUtcDate(input.birth_date, "birth_date").toISOString(),
      gender: input.gender,
      bulugh_age: bulughAge,
      bulugh_date: bulughDate.toISOString(),
      prayer_start_date: startDate.toISOString(),
      today_as_start: todayFlag
    } satisfies PersonalData;
  }

  private prepareWomenData(data?: Partial<WomenData>): WomenData {
    const merged = {
      ...DEFAULT_WOMEN_DATA,
      ...data
    };
    if (merged.haid_days_per_month > 15) {
      throw new ValidationError(
        "haid_days_per_month не может превышать 15 дней"
      );
    }
    return merged;
  }

  private prepareTravelData(travel?: CalculationInput["travel_data"]): TravelData {
    const periods =
      travel?.travel_periods?.map((period) => {
        const start = parseUtcDate(period.start_date, "travel_period.start");
        const end = parseUtcDate(period.end_date, "travel_period.end");
        if (end.isBefore(start)) {
          throw new ValidationError(
            "Период путешествия должен иметь end >= start",
            period
          );
        }
        const days =
          period.days_count ?? Math.max(1, diffInDays(start, end));
        return {
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          days_count: days
        };
      }) ?? [];

    ensureNonOverlappingPeriods(periods);

    const totalTravelDays =
      travel?.total_travel_days ?? sumTravelPeriodDays(periods);

    return {
      total_travel_days: totalTravelDays,
      travel_periods: periods
    };
  }

  private buildDebtCalculation(
    personal: PersonalData,
    women: WomenData | undefined,
    travel: TravelData,
    madhab: Madhab
  ) {
    const start = parseUtcDate(personal.bulugh_date, "bulugh_date");
    const end = personal.today_as_start
      ? nowUtc()
      : parseUtcDate(personal.prayer_start_date, "prayer_start_date");

    if (end.isBefore(start)) {
      throw new ValidationError("Конечная дата не может быть раньше начала");
    }

    const totalDays = diffInDays(start, end);
    if (totalDays > MAX_TOTAL_DAYS) {
      throw new ValidationError(
        "Период не может превышать 80 лет. Уточните входные данные"
      );
    }

    let excluded = travel.total_travel_days;
    if (personal.gender === "female" && women) {
      const haidDays = estimateHaidDays(
        totalDays,
        women.haid_days_per_month
      );
      const nifasDays =
        women.childbirth_count * women.nifas_days_per_childbirth;
      excluded += haidDays + nifasDays;
    }

    const effectiveDays = Math.max(0, Math.round(totalDays - excluded));
    const missedPrayers = this.createMissedPrayers(effectiveDays, madhab);
    const travelPrayers = this.createTravelPrayers(
      travel.total_travel_days
    );

    return {
      period: { start: start.toISOString(), end: end.toISOString() },
      total_days: totalDays,
      excluded_days: Math.round(excluded),
      effective_days: effectiveDays,
      missed_prayers: missedPrayers,
      travel_prayers: travelPrayers
    };
  }

  private createMissedPrayers(days: number, madhab: Madhab): MissedPrayers {
    const includeWitr = this.isWitrObligatory(madhab);
    return {
      fajr: days,
      dhuhr: days,
      asr: days,
      maghrib: days,
      isha: days,
      witr: includeWitr ? days : 0
    };
  }

  private createTravelPrayers(days: number): TravelPrayers {
    return {
      dhuhr_safar: days,
      asr_safar: days,
      isha_safar: days
    };
  }

  private createEmptyProgress(): RepaymentProgress {
    return {
      completed_prayers: emptyMissed(),
      completed_travel_prayers: emptyTravel(),
      last_updated: new Date().toISOString()
    };
  }

  private applyProgressEntries(
    snapshot: UserPrayerDebt,
    entries: ProgressEntry[]
  ): RepaymentProgress {
    const progress: RepaymentProgress = {
      completed_prayers: { ...snapshot.repayment_progress.completed_prayers },
      completed_travel_prayers: {
        ...snapshot.repayment_progress.completed_travel_prayers
      },
      last_updated: new Date().toISOString()
    };

    entries.forEach((entry) => {
      if ((entry.amount || 0) === 0) {
        return;
      }
      if (entry.type in progress.completed_prayers) {
        const key = entry.type as keyof MissedPrayers;
        if (
          key === "witr" &&
          !this.isWitrObligatory(snapshot.madhab)
        ) {
          throw new ValidationError(
            "Витр не является обязательным для выбранного мазхаба"
          );
        }
        const max = snapshot.debt_calculation.missed_prayers[key];
        const updated = progress.completed_prayers[key] + entry.amount;
        progress.completed_prayers[key] = this.clamp(updated, 0, max);
      } else if (entry.type in progress.completed_travel_prayers) {
        const key = entry.type as keyof TravelPrayers;
        const max = snapshot.debt_calculation.travel_prayers[key];
        const updated =
          progress.completed_travel_prayers[key] + entry.amount;
        progress.completed_travel_prayers[key] = this.clamp(
          updated,
          0,
          max
        );
      } else {
        throw new ValidationError(
          `Неизвестный тип намаза для прогресса: ${entry.type}`
        );
      }
    });

    return progress;
  }

  private clamp(value: number, min: number, max: number): number {
    if (Number.isNaN(value)) {
      return min;
    }
    return Math.min(Math.max(value, min), max);
  }

  private isWitrObligatory(madhab: Madhab): boolean {
    return madhab === "hanafi";
  }

  /**
   * Получает историю прогресса для графика
   */
  async getProgressHistory(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Array<{ date: string; completed: number; total: number }>> {
    return await this.repository.getProgressHistory(userId, startDate, endDate);
  }
}


