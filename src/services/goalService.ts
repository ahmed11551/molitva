import { v4 as uuid } from "uuid";
import type { UserGoal, GoalProgress, CreateGoalInput } from "../types/goals";
import type { UserPrayerDebt } from "../types/prayerDebt";
import { logger } from "../utils/logger";
import { nowUtc, parseUtcDate, diffInDays } from "../utils/dateUtils";

export class GoalService {
  // In-memory хранилище для целей (в продакшене использовать БД)
  private goals: Map<string, UserGoal[]> = new Map();

  /**
   * Создаёт автоматическую цель "Восполнить X за месяц"
   */
  async createMonthlyGoal(
    userId: string,
    targetAmount: number
  ): Promise<UserGoal> {
    const start = nowUtc();
    const end = start.add(1, "month");

    const goal: UserGoal = {
      id: uuid(),
      user_id: userId,
      type: "monthly_repayment",
      target_amount: targetAmount,
      current_amount: 0,
      period_start: start.toISOString(),
      period_end: end.toISOString(),
      status: "active",
      created_at: start.toISOString(),
      updated_at: start.toISOString(),
    };

    const userGoals = this.goals.get(userId) || [];
    userGoals.push(goal);
    this.goals.set(userId, userGoals);

    logger.info(`Created monthly goal for user ${userId}`, { goal_id: goal.id });
    return goal;
  }

  /**
   * Получает активные цели пользователя
   */
  async getActiveGoals(userId: string): Promise<UserGoal[]> {
    const userGoals = this.goals.get(userId) || [];
    return userGoals.filter(
      (g) => g.status === "active" && parseUtcDate(g.period_end, "period_end").isAfter(nowUtc())
    );
  }

  /**
   * Обновляет прогресс цели на основе текущего долга
   */
  async updateGoalProgress(
    userId: string,
    debt: UserPrayerDebt
  ): Promise<GoalProgress[]> {
    const goals = await this.getActiveGoals(userId);
    const totalCompleted = Object.values(
      debt.debt_calculation.completed_prayers
    ).reduce((sum, val) => sum + val, 0);

    const progressList: GoalProgress[] = [];

    for (const goal of goals) {
      // Обновляем текущий прогресс
      goal.current_amount = totalCompleted;
      goal.updated_at = nowUtc().toISOString();

      // Проверяем статус
      if (goal.current_amount >= goal.target_amount) {
        goal.status = "completed";
      } else {
        const endDate = parseUtcDate(goal.period_end, "period_end");
        if (endDate.isBefore(nowUtc()) && goal.current_amount < goal.target_amount) {
          goal.status = "failed";
        }
      }

      // Рассчитываем прогресс
      const progress_percent = Math.min(
        100,
        Math.round((goal.current_amount / goal.target_amount) * 100)
      );
      const remaining = Math.max(0, goal.target_amount - goal.current_amount);
      const endDate = parseUtcDate(goal.period_end, "period_end");
      const days_remaining = Math.max(0, diffInDays(nowUtc(), endDate));

      // Рассчитываем дату завершения (если темп известен)
      let estimated_completion_date: string | undefined;
      if (goal.current_amount > 0 && days_remaining > 0) {
        const dailyRate = goal.current_amount / (30 - days_remaining);
        if (dailyRate > 0) {
          const daysNeeded = Math.ceil(remaining / dailyRate);
          estimated_completion_date = nowUtc()
            .add(daysNeeded, "day")
            .toISOString();
        }
      }

      progressList.push({
        goal,
        progress_percent,
        remaining,
        days_remaining,
        estimated_completion_date,
      });
    }

    return progressList;
  }

  /**
   * Создаёт цель на основе рекомендаций AI
   */
  async createGoalFromAI(
    userId: string,
    input: CreateGoalInput
  ): Promise<UserGoal> {
    const start = input.period_start
      ? parseUtcDate(input.period_start, "period_start")
      : nowUtc();
    
    let end = input.period_end
      ? parseUtcDate(input.period_end, "period_end")
      : start.add(1, "month");

    if (input.type === "monthly_repayment" && !input.period_end) {
      end = start.add(1, "month");
    }

    const goal: UserGoal = {
      id: uuid(),
      user_id: userId,
      type: input.type,
      target_amount: input.target_amount,
      current_amount: 0,
      period_start: start.toISOString(),
      period_end: end.toISOString(),
      status: "active",
      created_at: nowUtc().toISOString(),
      updated_at: nowUtc().toISOString(),
    };

    const userGoals = this.goals.get(userId) || [];
    userGoals.push(goal);
    this.goals.set(userId, userGoals);

    return goal;
  }
}


