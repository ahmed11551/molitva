import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logger } from "../utils/logger";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

let supabaseClient: SupabaseClient | null = null;

export function initSupabase(config: SupabaseConfig): SupabaseClient {
  if (!config.url || !config.anonKey) {
    logger.warn(
      "Supabase credentials are not set. Using in-memory storage in dev mode."
    );
    return null as any;
  }

  supabaseClient = createClient(config.url, config.serviceRoleKey || config.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  logger.info("Supabase client initialized");
  return supabaseClient;
}

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error("Supabase client not initialized. Call initSupabase first.");
  }
  return supabaseClient;
}

