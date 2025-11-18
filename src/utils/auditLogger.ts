import { getSupabase } from "../db/supabase";
import { logger } from "./logger";

export interface AuditLogEntry {
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      logger.debug("Audit log skipped (Supabase not configured)");
      return;
    }

    const { error } = await supabase.from("audit_log").insert({
      user_id: entry.user_id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id || null,
      changes: entry.changes || null,
      metadata: entry.metadata || null
    });

    if (error) {
      logger.error("Failed to write audit log:", error);
    }
  } catch (err: any) {
    // Не падаем, если audit log не работает
    logger.warn("Audit log error (non-critical):", err.message);
  }
}

export const AuditActions = {
  DEBT_CALCULATED: "debt_calculated",
  DEBT_UPDATED: "debt_updated",
  PROGRESS_UPDATED: "progress_updated",
  JOB_CREATED: "job_created",
  JOB_COMPLETED: "job_completed",
  JOB_FAILED: "job_failed",
  PDF_REQUESTED: "pdf_requested"
} as const;

export const EntityTypes = {
  PRAYER_DEBT: "prayer_debt",
  CALCULATION_JOB: "calculation_job"
} as const;

