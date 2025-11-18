import type { Request, Response } from "express";
import type { UserPrayerDebt } from "../types/prayerDebt";
import { PrayerDebtService } from "../services/prayerDebtService";
import { EReplikaClient } from "../services/eReplikaClient";
import { webhookPayloadSchema } from "../validators/prayerDebtSchemas";
import { logger } from "../utils/logger";

export class WebhookController {
  constructor(
    private readonly service: PrayerDebtService,
    private readonly eReplikaClient: EReplikaClient
  ) {}

  handle = async (req: Request, res: Response) => {
    try {
      // Валидация подписи (если настроена)
      const signature = req.header("x-e-replika-signature");
      if (signature && this.eReplikaClient) {
        const isValid = this.eReplikaClient.validateWebhookSignature(
          JSON.stringify(req.body),
          signature
        );
        if (!isValid) {
          logger.warn("Invalid webhook signature", { signature });
          res.status(401).json({ message: "Invalid signature" });
          return;
        }
      }

      const payload = webhookPayloadSchema.parse(req.body);
      
      logger.info("Webhook received", {
        job_id: payload.job_id,
        status: payload.status
      });

      if (payload.status === "done" && payload.result) {
        await this.service.resolveJob(
          payload.job_id,
          "done",
          payload.result as UserPrayerDebt
        );
        logger.info(`Job ${payload.job_id} resolved successfully`);
      } else if (payload.status === "error") {
        await this.service.resolveJob(
          payload.job_id,
          "error",
          undefined,
          payload.error
        );
        logger.warn(`Job ${payload.job_id} failed`, { error: payload.error });
      } else {
        logger.warn("Unknown webhook status", { payload });
      }

      res.status(204).send();
    } catch (error: any) {
      logger.error("Webhook handling error", {
        error: error.message,
        body: req.body
      });

      if (error.name === "ZodError") {
        res.status(400).json({
          message: "Invalid webhook payload",
          errors: error.errors
        });
        return;
      }

      res.status(500).json({ message: "Internal server error" });
    }
  };
}


