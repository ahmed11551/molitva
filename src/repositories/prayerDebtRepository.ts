import type { CalculationJob, RepaymentProgress, UserPrayerDebt } from "../types/prayerDebt";
import { NotFoundError } from "../errors/appError";
import { getSupabase } from "../db/supabase";
import { logger } from "../utils/logger";
import { logAudit, AuditActions, EntityTypes } from "../utils/auditLogger";
import { encryptObject, decryptObject } from "../utils/encryption";

interface PrayerDebtRow {
  id: string;
  user_id: string;
  calc_version: string;
  madhab: string;
  calculation_method: string;
  personal_data: any;
  women_data: any;
  travel_data: any;
  debt_calculation: any;
  repayment_progress: any;
  created_at: string;
  updated_at: string;
}

interface CalculationJobRow {
  id: string;
  job_id: string;
  user_id: string;
  status: string;
  payload: any;
  result: any;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export class PrayerDebtRepository {
  private useSupabase: boolean;
  private encryptionEnabled: boolean;

  constructor() {
    const config = loadConfig();
    this.encryptionEnabled = config.encryptionEnabled;
    
    try {
      getSupabase();
      this.useSupabase = true;
      logger.info("PrayerDebtRepository: Using Supabase", {
        encryption: this.encryptionEnabled ? "enabled" : "disabled"
      });
    } catch {
      this.useSupabase = false;
      logger.warn("PrayerDebtRepository: Using in-memory storage (Supabase not configured)");
    }
  }

  private readonly inMemoryDebts = new Map<string, UserPrayerDebt>();
  private readonly inMemoryJobs = new Map<string, CalculationJob>();

  async findByUserId(userId: string): Promise<UserPrayerDebt | undefined> {
    if (!this.useSupabase) {
      return this.inMemoryDebts.get(userId);
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("prayer_debts")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Not found
          return undefined;
        }
        throw error;
      }

      return this.mapRowToDebt(data as PrayerDebtRow);
    } catch (error: any) {
      logger.error("Error finding debt by user_id:", error);
      throw error;
    }
  }

  async saveDebt(debt: UserPrayerDebt): Promise<UserPrayerDebt> {
    if (!this.useSupabase) {
      this.inMemoryDebts.set(debt.user_id, debt);
      return debt;
    }

    try {
      const supabase = getSupabase();
      const row = this.mapDebtToRow(debt);

      const { data, error } = await supabase
        .from("prayer_debts")
        .upsert(row, {
          onConflict: "user_id",
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;

      const saved = this.mapRowToDebt(data as PrayerDebtRow);
      
      // Audit log
      await logAudit({
        user_id: saved.user_id,
        action: AuditActions.DEBT_CALCULATED,
        entity_type: EntityTypes.PRAYER_DEBT,
        entity_id: saved.user_id,
        changes: {
          calc_version: saved.calc_version,
          effective_days: saved.debt_calculation.effective_days
        }
      });

      return saved;
    } catch (error: any) {
      logger.error("Error saving debt:", error);
      throw error;
    }
  }

  async updateProgress(
    userId: string,
    progress: RepaymentProgress
  ): Promise<UserPrayerDebt> {
    if (!this.useSupabase) {
      const existing = this.inMemoryDebts.get(userId);
      if (!existing) {
        throw new NotFoundError("Расчёт для пользователя не найден");
      }
      existing.repayment_progress = progress;
      this.inMemoryDebts.set(userId, existing);
      return existing;
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("prayer_debts")
        .update({
          repayment_progress: progress
        })
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new NotFoundError("Расчёт для пользователя не найден");
        }
        throw error;
      }

      const updated = this.mapRowToDebt(data as PrayerDebtRow);
      
      // Save progress history (upsert for today)
      const today = new Date().toISOString().split('T')[0];
      const totalCompleted = Object.values(progress.completed_prayers).reduce(
        (sum, val) => sum + val, 0
      ) + Object.values(progress.completed_travel_prayers).reduce(
        (sum, val) => sum + val, 0
      );

      await supabase
        .from("progress_history")
        .upsert({
          user_id: userId,
          date: today,
          completed_prayers: progress.completed_prayers,
          completed_travel_prayers: progress.completed_travel_prayers,
          total_completed: totalCompleted
        }, {
          onConflict: "user_id,date"
        })
        .select();

      // Audit log
      await logAudit({
        user_id: userId,
        action: AuditActions.PROGRESS_UPDATED,
        entity_type: EntityTypes.PRAYER_DEBT,
        entity_id: userId,
        changes: {
          completed_prayers: progress.completed_prayers,
          completed_travel_prayers: progress.completed_travel_prayers
        }
      });

      return updated;
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      logger.error("Error updating progress:", error);
      throw error;
    }
  }

  /**
   * Получает историю прогресса для графика
   */
  async getProgressHistory(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Array<{ date: string; completed: number; total: number }>> {
    if (!this.useSupabase) {
      // In-memory: возвращаем пустой массив
      return [];
    }

    try {
      const supabase = getSupabase();
      let query = supabase
        .from("progress_history")
        .select("date, total_completed")
        .eq("user_id", userId)
        .order("date", { ascending: true });

      if (startDate) {
        query = query.gte("date", startDate);
      }
      if (endDate) {
        query = query.lte("date", endDate);
      }

      const { data, error } = await query;

      if (error) {
        logger.error("Error fetching progress history:", error);
        return [];
      }

      // Получаем общий долг для расчёта total
      const debt = await this.findByUserId(userId);
      const total = debt
        ? Object.values(debt.debt_calculation.missed_prayers).reduce((sum, val) => sum + val, 0) +
          Object.values(debt.debt_calculation.travel_prayers).reduce((sum, val) => sum + val, 0)
        : 0;

      return (data || []).map((row) => ({
        date: row.date,
        completed: row.total_completed || 0,
        total: total,
      }));
    } catch (error: any) {
      logger.error("Error getting progress history:", error);
      return [];
    }
  }

  async createJob(job: CalculationJob): Promise<CalculationJob> {
    if (!this.useSupabase) {
      this.inMemoryJobs.set(job.job_id, job);
      return job;
    }

    try {
      const supabase = getSupabase();
      const row = this.mapJobToRow(job);

      const { data, error } = await supabase
        .from("calculation_jobs")
        .insert(row)
        .select()
        .single();

      if (error) throw error;

      const created = this.mapRowToJob(data as CalculationJobRow);
      
      // Audit log
      await logAudit({
        user_id: created.user_id,
        action: AuditActions.JOB_CREATED,
        entity_type: EntityTypes.CALCULATION_JOB,
        entity_id: created.job_id
      });

      return created;
    } catch (error: any) {
      logger.error("Error creating job:", error);
      throw error;
    }
  }

  async updateJob(
    jobId: string,
    updater: (job: CalculationJob) => CalculationJob
  ): Promise<CalculationJob> {
    if (!this.useSupabase) {
      const current = this.inMemoryJobs.get(jobId);
      if (!current) {
        throw new NotFoundError("Job не найден");
      }
      const updated = updater(current);
      updated.updated_at = new Date().toISOString();
      this.inMemoryJobs.set(jobId, updated);
      return updated;
    }

    try {
      const supabase = getSupabase();
      const { data: currentData, error: fetchError } = await supabase
        .from("calculation_jobs")
        .select("*")
        .eq("job_id", jobId)
        .single();

      if (fetchError || !currentData) {
        throw new NotFoundError("Job не найден");
      }

      const current = this.mapRowToJob(currentData as CalculationJobRow);
      const updated = updater(current);
      updated.updated_at = new Date().toISOString();

      const row = this.mapJobToRow(updated);
      const { data, error } = await supabase
        .from("calculation_jobs")
        .update(row)
        .eq("job_id", jobId)
        .select()
        .single();

      if (error) throw error;

      const updated = this.mapRowToJob(data as CalculationJobRow);
      
      // Audit log
      if (updated.status === "done") {
        await logAudit({
          user_id: updated.user_id,
          action: AuditActions.JOB_COMPLETED,
          entity_type: EntityTypes.CALCULATION_JOB,
          entity_id: updated.job_id
        });
      } else if (updated.status === "error") {
        await logAudit({
          user_id: updated.user_id,
          action: AuditActions.JOB_FAILED,
          entity_type: EntityTypes.CALCULATION_JOB,
          entity_id: updated.job_id,
          metadata: { error: updated.error }
        });
      }

      return updated;
    } catch (error: any) {
      if (error instanceof NotFoundError) throw error;
      logger.error("Error updating job:", error);
      throw error;
    }
  }

  async findJob(jobId: string): Promise<CalculationJob | undefined> {
    if (!this.useSupabase) {
      return this.inMemoryJobs.get(jobId);
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("calculation_jobs")
        .select("*")
        .eq("job_id", jobId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return undefined;
        }
        throw error;
      }

      return this.mapRowToJob(data as CalculationJobRow);
    } catch (error: any) {
      logger.error("Error finding job:", error);
      throw error;
    }
  }

  private mapDebtToRow(debt: UserPrayerDebt): Omit<PrayerDebtRow, "id" | "created_at" | "updated_at"> {
    // Шифруем персональные данные, если включено шифрование
    let personal_data = debt.personal_data;
    let women_data = debt.women_data;

    if (this.encryptionEnabled) {
      try {
        personal_data = encryptObject(debt.personal_data) as any;
        if (debt.women_data) {
          women_data = encryptObject(debt.women_data) as any;
        }
      } catch (error: any) {
        logger.error("Failed to encrypt personal data", { error: error.message });
        // Продолжаем без шифрования в случае ошибки
      }
    }

    return {
      user_id: debt.user_id,
      calc_version: debt.calc_version,
      madhab: debt.madhab,
      calculation_method: debt.calculation_method,
      personal_data,
      women_data: women_data || null,
      travel_data: debt.travel_data,
      debt_calculation: debt.debt_calculation,
      repayment_progress: debt.repayment_progress
    };
  }

  private mapRowToDebt(row: PrayerDebtRow): UserPrayerDebt {
    // Расшифровываем персональные данные, если они зашифрованы
    let personal_data = row.personal_data;
    let women_data = row.women_data;

    if (this.encryptionEnabled) {
      try {
        // Проверяем, зашифрованы ли данные (формат: "iv:tag:encrypted")
        if (typeof row.personal_data === "string" && row.personal_data.includes(":")) {
          personal_data = decryptObject(row.personal_data);
        }
        if (row.women_data && typeof row.women_data === "string" && row.women_data.includes(":")) {
          women_data = decryptObject(row.women_data);
        }
      } catch (error: any) {
        logger.error("Failed to decrypt personal data", { error: error.message });
        // Если расшифровка не удалась, возможно данные не зашифрованы
        // Продолжаем с исходными данными
      }
    }

    return {
      user_id: row.user_id,
      calc_version: row.calc_version,
      madhab: row.madhab as "hanafi" | "shafii",
      calculation_method: row.calculation_method as "manual" | "calculator",
      personal_data,
      women_data,
      travel_data: row.travel_data,
      debt_calculation: row.debt_calculation,
      repayment_progress: row.repayment_progress
    };
  }

  private mapJobToRow(job: CalculationJob): Omit<CalculationJobRow, "id" | "created_at" | "updated_at"> {
    return {
      job_id: job.job_id,
      user_id: job.user_id,
      status: job.status,
      payload: job.payload || null,
      result: job.result || null,
      error: job.error || null
    };
  }

  private mapRowToJob(row: CalculationJobRow): CalculationJob {
    return {
      job_id: row.job_id,
      user_id: row.user_id,
      status: row.status as "pending" | "done" | "error",
      created_at: row.created_at,
      updated_at: row.updated_at,
      payload: row.payload,
      result: row.result,
      error: row.error || undefined
    };
  }
}
