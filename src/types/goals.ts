export interface UserGoal {
  id: string;
  user_id: string;
  type: "monthly_repayment" | "daily_repayment" | "milestone";
  target_amount: number;
  current_amount: number;
  period_start: string; // ISO date
  period_end: string; // ISO date
  status: "active" | "completed" | "failed";
  created_at: string;
  updated_at: string;
}

export interface GoalProgress {
  goal: UserGoal;
  progress_percent: number;
  remaining: number;
  days_remaining: number;
  estimated_completion_date?: string;
}

export interface CreateGoalInput {
  type: "monthly_repayment" | "daily_repayment" | "milestone";
  target_amount: number;
  period_start?: string; // Если не указано, начинается с сегодня
  period_end?: string; // Для monthly - автоматически +1 месяц
}

