import axios, { AxiosInstance, AxiosError } from "axios";
import { logger } from "../utils/logger";
import type { CalculationInput, CalculationJob, UserPrayerDebt } from "../types/prayerDebt";
import type {
  CatalogCategory,
  CatalogItem,
  CatalogItemsResponse
} from "../types/dua";

export interface EReplikaConfig {
  baseUrl: string;
  apiKey: string;
  webhookSecret?: string; // Для валидации webhook подписей
  retryAttempts?: number;
  retryDelay?: number;
}

interface PdfReportResponse {
  url?: string;
  job_id?: string;
  status?: "pending" | "ready";
  message?: string;
}

export class EReplikaClient {
  private readonly http: AxiosInstance | null;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;

  constructor(private readonly config: EReplikaConfig) {
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;

    if (config.baseUrl && config.apiKey) {
      this.http = axios.create({
        baseURL: config.baseUrl,
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 30_000 // Увеличено для PDF генерации
      });

      // Interceptor для логирования ошибок
      this.http.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
          logger.error("E-Replika API error:", {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            message: error.message
          });
          return Promise.reject(error);
        }
      );
    } else {
      this.http = null;
      logger.warn(
        "E-Replika credentials are not set. Requests will be skipped in dev mode."
      );
    }
  }

  /**
   * Отправляет задачу на асинхронный расчёт в e-Replika
   * С retry логикой для надёжности
   */
  async enqueueCalculation(
    job: CalculationJob,
    payload: CalculationInput
  ): Promise<void> {
    if (!this.http) {
      logger.info(
        "Skip e-Replika calculation enqueue (no credentials). Job:",
        job.job_id
      );
      return;
    }

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await this.http.post(
          "/api/prayer-debt/calculations",
          {
            job_id: job.job_id,
            user_id: job.user_id,
            payload,
            webhook_url: `${process.env.API_BASE_URL || "http://localhost:4000"}/api/webhooks/prayer-debt`
          },
          {
            timeout: 15_000
          }
        );

        logger.info(`Calculation job ${job.job_id} enqueued successfully`, {
          attempt,
          status: response.status
        });
        return;
      } catch (error: any) {
        lastError = error;
        const isRetryable = this.isRetryableError(error);
        
        if (attempt < this.retryAttempts && isRetryable) {
          const delay = this.retryDelay * attempt;
          logger.warn(
            `Failed to enqueue job ${job.job_id}, retrying in ${delay}ms (attempt ${attempt}/${this.retryAttempts})`,
            { error: error.message }
          );
          await this.sleep(delay);
        } else {
          break;
        }
      }
    }

    logger.error(`Failed to enqueue calculation job ${job.job_id} after ${this.retryAttempts} attempts`, {
      error: lastError?.message
    });
    throw new Error(`Не удалось отправить задачу в e-Replika: ${lastError?.message || "Unknown error"}`);
  }

  /**
   * Запрашивает генерацию PDF отчёта через e-Replika
   * Поддерживает как синхронную, так и асинхронную генерацию
   */
  async requestPdfReport(debt: UserPrayerDebt): Promise<string> {
    if (!this.http) {
      logger.info("Skip PDF request, return mock URL");
      return `https://mock.e-replika.dev/report/${debt.user_id}.pdf`;
    }

    try {
      const response = await this.http.post<PdfReportResponse>(
        "/reports/pdf",
        {
          user_id: debt.user_id,
          snapshot: debt,
          format: "pdf",
          language: "ru"
        },
        {
          timeout: 60_000 // PDF генерация может занять время
        }
      );

      const data = response.data;

      // Если PDF готов сразу
      if (data.url) {
        logger.info(`PDF report ready immediately for user ${debt.user_id}`);
        return data.url;
      }

      // Если PDF генерируется асинхронно
      if (data.job_id && data.status === "pending") {
        logger.info(`PDF generation started, job_id: ${data.job_id}`);
        // В будущем можно добавить polling для проверки готовности
        // Пока возвращаем URL для polling
        return `${this.config.baseUrl}/reports/pdf/${data.job_id}`;
      }

      throw new Error("Неожиданный формат ответа от e-Replika PDF API");
    } catch (error: any) {
      logger.error("Failed to request PDF report", {
        userId: debt.user_id,
        error: error.message,
        status: error.response?.status
      });

      // Fallback: возвращаем mock URL в dev режиме
      if (error.response?.status === 404 || error.code === "ECONNREFUSED") {
        logger.warn("Using fallback PDF URL");
        return `https://mock.e-replika.dev/report/${debt.user_id}.pdf`;
      }

      throw new Error(`Не удалось сгенерировать PDF отчёт: ${error.message}`);
    }
  }

  /**
   * Проверяет готовность PDF отчёта (для асинхронной генерации)
   */
  async checkPdfStatus(jobId: string): Promise<{ url?: string; status: string }> {
    if (!this.http) {
      throw new Error("E-Replika client not configured");
    }

    const response = await this.http.get<{ url?: string; status: string }>(
      `/reports/pdf/${jobId}`
    );
    return response.data;
  }

  async getCatalogCategories(): Promise<CatalogCategory[]> {
    const client = this.ensureClient();
    const response = await client.get<CatalogCategory[]>("/api/v1/catalog/categories");
    return response.data;
  }

  async getCatalogItems(params: {
    category?: string;
    q?: string;
    lang?: string;
    limit?: number;
    offset?: number;
    sort?: string;
  }): Promise<CatalogItemsResponse> {
    const client = this.ensureClient();
    const response = await client.get<CatalogItemsResponse>("/api/v1/catalog/items", {
      params
    });
    return response.data;
  }

  async getCatalogItem(itemId: string): Promise<CatalogItem> {
    const client = this.ensureClient();
    const response = await client.get<CatalogItem>(`/api/v1/catalog/items/${itemId}`);
    return response.data;
  }

  /**
   * Получает глоссарий терминов из e-Replika
   */
  async getGlossary(): Promise<{ terms: any[] }> {
    if (!this.http) {
      logger.warn("E-Replika client not configured, returning empty glossary");
      return { terms: [] };
    }

    try {
      const response = await this.http.get<{ terms: any[] }>("/api/v1/glossary");
      return response.data;
    } catch (error: any) {
      logger.error("Failed to fetch glossary from e-Replika", {
        error: error.message,
        status: error.response?.status,
      });
      // Возвращаем пустой массив, fallback будет в GlossaryService
      return { terms: [] };
    }
  }

  /**
   * Валидирует webhook подпись от e-Replika (если настроен webhookSecret)
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) {
      logger.warn("Webhook secret not configured, skipping signature validation");
      return true; // В dev режиме пропускаем валидацию
    }

    // Простая проверка подписи (можно улучшить с HMAC)
    // В production используйте HMAC-SHA256
    const expectedSignature = this.config.webhookSecret;
    return signature === expectedSignature;
  }

  /**
   * Проверяет, можно ли повторить запрос при ошибке
   */
  private isRetryableError(error: any): boolean {
    if (!error.response) {
      // Сетевые ошибки - можно повторить
      return true;
    }

    const status = error.response.status;
    // 5xx ошибки и 429 (rate limit) - можно повторить
    return status >= 500 || status === 429 || status === 408;
  }

  /**
   * Утилита для задержки
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private ensureClient(): AxiosInstance {
    if (!this.http) {
      throw new Error("E-Replika client is not configured");
    }
    return this.http;
  }
}


