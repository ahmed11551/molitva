import { Request, Response } from "express";
import { AIService } from "../services/aiService";
import { PrayerDebtService } from "../services/prayerDebtService";
import { NotFoundError } from "../errors/appError";

export class AIController {
  constructor(
    private aiService: AIService,
    private prayerDebtService: PrayerDebtService
  ) {}

  async getRepaymentPlan(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.user_id as string || "default";
      const snapshot = await this.prayerDebtService.getSnapshot(userId);
      const plan = this.aiService.optimizeRepaymentSchedule(snapshot);
      res.json(plan);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Ошибка при генерации плана", error: error.message });
    }
  }

  async getMotivationalMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.user_id as string || "default";
      const snapshot = await this.prayerDebtService.getSnapshot(userId);
      const message = this.aiService.generateMotivationalMessage(snapshot);
      res.json(message);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Ошибка при генерации сообщения", error: error.message });
    }
  }

  async getPrayerPatterns(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.user_id as string || "default";
      const snapshot = await this.prayerDebtService.getSnapshot(userId);
      const patterns = this.aiService.detectMissedPrayerPatterns(snapshot);
      res.json({ patterns });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Ошибка при анализе паттернов", error: error.message });
    }
  }
}

