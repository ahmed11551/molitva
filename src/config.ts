import type { EReplikaConfig } from "./services/eReplikaClient";
import type { SupabaseConfig } from "./db/supabase";
import type { Madhab } from "./types/prayerDebt";

export interface AppConfig {
  port: number;
  calcVersion: string;
  madhab: Madhab;
  eReplika: EReplikaConfig;
  supabase: SupabaseConfig;
  encryptionEnabled: boolean;
}

const DEFAULT_MADHAB: Madhab = "hanafi";
const SUPPORTED_MADHABS: Madhab[] = ["hanafi", "shafii"];

function resolveMadhab(): Madhab {
  const envValue = (process.env.MADHAB || "").toLowerCase();
  if (!envValue) {
    return DEFAULT_MADHAB;
  }
  if (SUPPORTED_MADHABS.includes(envValue as Madhab)) {
    return envValue as Madhab;
  }
  return DEFAULT_MADHAB;
}

export const loadConfig = (): AppConfig => ({
  port: Number(process.env.PORT || 4000),
  calcVersion: process.env.CALC_VERSION || "1.0.0",
  madhab: resolveMadhab(),
  eReplika: {
    baseUrl: process.env.EREPLIKA_BASE_URL || "https://bot.e-replika.ru",
    apiKey: process.env.EREPLIKA_API_KEY || "test_token_123",
    webhookSecret: process.env.EREPLIKA_WEBHOOK_SECRET,
    retryAttempts: Number(process.env.EREPLIKA_RETRY_ATTEMPTS || "3"),
    retryDelay: Number(process.env.EREPLIKA_RETRY_DELAY || "1000")
  },
  supabase: {
    url: process.env.SUPABASE_URL || "",
    anonKey: process.env.SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  encryptionEnabled: process.env.ENABLE_ENCRYPTION === "true" && !!process.env.ENCRYPTION_KEY
});


