import crypto from "crypto";
import { logger } from "./logger";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Получает ключ шифрования из переменной окружения или генерирует его
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey) {
    // Если ключ в base64, декодируем его
    if (envKey.length === 44 && envKey.endsWith("=")) {
      return Buffer.from(envKey, "base64");
    }
    // Иначе используем как есть (первые 32 байта)
    return Buffer.from(envKey.slice(0, KEY_LENGTH * 2), "hex");
  }

  // В dev режиме генерируем ключ (в production это должно быть в env)
  logger.warn("ENCRYPTION_KEY not set, using dev key (NOT SECURE FOR PRODUCTION)");
  return crypto.scryptSync("dev-key-change-in-production", "salt", KEY_LENGTH);
}

/**
 * Шифрует данные с использованием AES-256-GCM
 */
export function encryptData(data: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    // Формат: iv:tag:encrypted
    return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
  } catch (error: any) {
    logger.error("Encryption failed", { error: error.message });
    throw new Error("Ошибка шифрования данных");
  }
}

/**
 * Расшифровывает данные
 */
export function decryptData(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(":");
    
    if (parts.length !== 3) {
      throw new Error("Неверный формат зашифрованных данных");
    }

    const iv = Buffer.from(parts[0], "hex");
    const tag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error: any) {
    logger.error("Decryption failed", { error: error.message });
    throw new Error("Ошибка расшифровки данных");
  }
}

/**
 * Шифрует объект (JSON)
 */
export function encryptObject<T>(obj: T): string {
  return encryptData(JSON.stringify(obj));
}

/**
 * Расшифровывает объект (JSON)
 */
export function decryptObject<T>(encryptedData: string): T {
  const decrypted = decryptData(encryptedData);
  return JSON.parse(decrypted) as T;
}

