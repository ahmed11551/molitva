import { Request, Response } from "express";
import { GoalService } from "../services/goalService";
import { PrayerDebtService } from "../services/prayerDebtService";
import { asyncHandler } from "../utils/asyncHandler";
import { logger } from "../utils/logger";

export class GoalController {
  constructor(
    private readonly goalService: GoalService,
    private readonly prayerDebtService: PrayerDebtService
  ) {}

  extractUserId = (req: Request): string => {
    const userId = req.header("x-user-id") || (req.query.user_id as string);
    if (!userId) {
      throw new Error("user_id required in header x-user-id or query param");
    }
    return userId;
  };

  /**
   * GET /api/goals
   * Получает активные цели пользователя с прогрессом
   */
  getGoals = asyncHandler(async (req: Request, res: Response) => {
    const userId = this.extractUserId(req);
    
    // Получаем текущий долг для расчёта прогресса
    const debt = await this.prayerDebtService.getSnapshot(userId).catch(() => null);
    
    if (!debt) {
      return res.json({ goals: [], progress: [] });
    }

    const progress = await this.goalService.updateGoalProgress(userId, debt);
    
    res.json({
      goals: progress.map(p => p.goal),
      progress,
    });
  });

  /**
   * POST /api/goals
   * Создаёт новую цель
   */
  createGoal = asyncHandler(async (req: Request, res: Response) => {
    const userId = this.extractUserId(req);
    const { type, target_amount, period_start, period_end } = req.body;

    if (!type || !target_amount) {
      return res.status(400).json({
        message: "type and target_amount are required",
      });
    }

    const goal = await this.goalService.createGoalFromAI(userId, {
      type,
      target_amount,
      period_start,
      period_end,
    });

    res.status(201).json(goal);
  });

  /**
   * POST /api/goals/auto-monthly
   * Создаёт автоматическую месячную цель на основе текущего долга
   */
  createAutoMonthlyGoal = asyncHandler(async (req: Request, res: Response) => {
    const userId = this.extractUserId(req);
    
    const debt = await this.prayerDebtService.getSnapshot(userId);
    const total = Object.values(debt.debt_calculation.missed_prayers).reduce(
      (sum, val) => sum + val,
      0
    );
    const completed = Object.values(debt.debt_calculation.completed_prayers).reduce(
      (sum, val) => sum + val,
      0
    );
    const remaining = total - completed;

    // Предлагаем цель: 10% от оставшегося или минимум 30 намазов
    const targetAmount = Math.max(30, Math.ceil(remaining * 0.1));

    const goal = await this.goalService.createMonthlyGoal(userId, targetAmount);

    logger.info(`Created auto monthly goal for user ${userId}`, {
      goal_id: goal.id,
      target_amount: goal.target_amount,
    });

    res.status(201).json(goal);
  });
}

