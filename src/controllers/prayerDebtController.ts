import type { Request, Response } from "express";
import { PrayerDebtService } from "../services/prayerDebtService";
import {
  calculationSchema,
  progressSchema
} from "../validators/prayerDebtSchemas";
import { ValidationError } from "../errors/appError";

export class PrayerDebtController {
  constructor(private readonly service: PrayerDebtService) {}

  calculate = async (req: Request, res: Response) => {
    const userId = this.extractUserId(req);
    const payload = calculationSchema.parse(req.body);
    const snapshot = await this.service.calculateDebt(userId, payload);
    res.json(snapshot);
  };

  snapshot = async (req: Request, res: Response) => {
    const userId = this.extractUserId(req);
    const snapshot = await this.service.getSnapshot(userId);
    res.json(snapshot);
  };

  updateProgress = async (req: Request, res: Response) => {
    const userId = this.extractUserId(req);
    const payload = progressSchema.parse(req.body);
    const updated = await this.service.updateProgress(userId, payload.entries);
    res.json(updated.repayment_progress);
  };

  report = async (req: Request, res: Response) => {
    const userId = this.extractUserId(req);
    const result = await this.service.requestPdfReport(userId);
    res.json(result);
  };

  pdfStatus = async (req: Request, res: Response) => {
    const jobId = req.params.jobId;
    const status = await this.service.checkPdfStatus(jobId);
    res.json(status);
  };

  enqueueCalculation = async (req: Request, res: Response) => {
    const userId = this.extractUserId(req);
    const payload = calculationSchema.parse(req.body);
    const job = await this.service.enqueueCalculation(userId, payload);
    res.status(202).json({
      job_id: job.job_id,
      status: job.status
    });
  };

  calculationStatus = async (req: Request, res: Response) => {
    const job = await this.service.getCalculationJob(req.params.jobId);
    res.json(job);
  };

  getProgressHistory = async (req: Request, res: Response) => {
    const userId = this.extractUserId(req);
    const startDate = req.query.start_date as string | undefined;
    const endDate = req.query.end_date as string | undefined;

    const history = await this.service.getProgressHistory(userId, startDate, endDate);
    res.json({ history });
  };

  private extractUserId(req: Request): string {
    const header = req.header("x-user-id") || (req.query.user_id as string);
    if (!header) {
      throw new ValidationError(
        "Укажите X-User-Id в заголовке или user_id в query"
      );
    }
    return header;
  }
}


