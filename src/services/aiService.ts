import type { UserPrayerDebt, RepaymentProgress } from "../types/prayerDebt";

export interface RepaymentPlan {
  suggestions: PlanSuggestion[];
  dailyRate: number;
  estimatedDays: number;
  milestones: Milestone[];
}

export interface PlanSuggestion {
  time: string;
  prayer: string;
  amount: number;
  description: string;
}

export interface Milestone {
  target: number;
  message: string;
  achieved: boolean;
}

export interface MotivationalMessage {
  text: string;
  source?: string;
  type: "milestone" | "quote" | "hadith" | "encouragement";
}

export interface PrayerPattern {
  prayer: string;
  missedCount: number;
  trend: "increasing" | "decreasing" | "stable";
  recommendation?: string;
}

/**
 * AI-планировщик восполнения намазов
 * Анализирует текущий прогресс и предлагает оптимальный план
 */
export class AIService {
  /**
   * Оптимизирует расписание восполнения на основе текущего прогресса
   */
  optimizeRepaymentSchedule(debt: UserPrayerDebt): RepaymentPlan {
    const { missed_prayers, completed_prayers } = debt.debt_calculation;
    const total = Object.values(missed_prayers).reduce((a, b) => a + b, 0);
    const completed = Object.values(completed_prayers).reduce((a, b) => a + b, 0);
    const remaining = total - completed;

    // Анализ текущего темпа (если есть история)
    const lastUpdated = new Date(debt.repayment_progress.last_updated);
    const daysSinceStart = Math.max(1, Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)));
    const currentDailyRate = completed > 0 ? Math.max(1, Math.round(completed / daysSinceStart)) : 10;

    // Оптимальный темп (целевой: закрыть за 1-2 года)
    const targetDays = 365; // 1 год
    const optimalDailyRate = Math.ceil(remaining / targetDays);
    const dailyRate = Math.max(optimalDailyRate, Math.min(currentDailyRate, 20)); // Не более 20 в день

    // Генерируем предложения
    const suggestions: PlanSuggestion[] = [
      {
        time: "После Фаджра",
        prayer: "Фаджр",
        amount: 1,
        description: "Добавьте 1 каза-намаз после утреннего намаза"
      },
      {
        time: "После Асра",
        prayer: "Аср",
        amount: 2,
        description: "После Асра восполните 2 каза-намаза"
      },
      {
      time: "В выходные",
      prayer: "Любой",
      amount: 5,
      description: "В выходные дни увеличьте темп до 5 каза-намазов"
      }
    ];

    // Милстоуны
    const milestones: Milestone[] = [
      {
        target: 100,
        message: "Поздравляем! Первые 100 намазов восполнены!",
        achieved: completed >= 100
      },
      {
        target: 1000,
        message: "Ма ша Аллах! Вы достигли 1000 намазов!",
        achieved: completed >= 1000
      },
      {
        target: Math.floor(total / 2),
        message: "Вы прошли половину пути. Пусть Аллах укрепит вас!",
        achieved: completed >= Math.floor(total / 2)
      },
      {
        target: total,
        message: "Аллаху Акбар! Все намазы восполнены!",
        achieved: completed >= total
      }
    ];

    const estimatedDays = Math.ceil(remaining / dailyRate);

    return {
      suggestions,
      dailyRate,
      estimatedDays,
      milestones
    };
  }

  /**
   * Генерирует мотивационное сообщение на основе прогресса
   */
  generateMotivationalMessage(debt: UserPrayerDebt): MotivationalMessage {
    const { missed_prayers, completed_prayers } = debt.debt_calculation;
    const total = Object.values(missed_prayers).reduce((a, b) => a + b, 0);
    const completed = Object.values(completed_prayers).reduce((a, b) => a + b, 0);
    const progress = total > 0 ? (completed / total) * 100 : 0;

    // Проверяем милстоуны
    const milestones = [
      { target: 100, message: "Поздравляем! Первые 100 намазов восполнены! 🎉" },
      { target: 500, message: "Ма ша Аллах! Уже 500 намазов! Продолжайте в том же духе! 💪" },
      { target: 1000, message: "Невероятно! 1000 намазов восполнено! Да вознаградит вас Аллах! 🌟" },
      { target: Math.floor(total / 2), message: "Вы прошли половину пути! Пусть Аллах укрепит вас! 🙏" },
      { target: total, message: "Аллаху Акбар! Все намазы восполнены! Да примет Аллах ваши молитвы! 🕌" }
    ];

    for (const milestone of milestones) {
      if (completed >= milestone.target && completed < milestone.target + 10) {
        return {
          text: milestone.message,
          type: "milestone"
        };
      }
    }

    // Цитаты и хадисы
    const quotes = [
      {
        text: "И совершайте намаз, и давайте закят, и повинуйтесь Посланнику, — быть может, вы будете помилованы",
        source: "Коран, 24:56",
        type: "quote" as const
      },
      {
        text: "Намаз — это свет верующего",
        source: "Хадис",
        type: "hadith" as const
      },
      {
        text: "Аллах не устанет, пока вы не устанете. И самая любимая молитва для Аллаха — та, которую совершают постоянно, даже если она мала",
        source: "Хадис аль-Бухари",
        type: "hadith" as const
      },
      {
        text: "Каждый шаг на пути к восполнению намазов — это шаг ближе к довольству Аллаха",
        type: "encouragement" as const
      }
    ];

    // Выбираем цитату в зависимости от прогресса
    const quoteIndex = Math.floor(progress / 25) % quotes.length;
    return quotes[quoteIndex];
  }

  /**
   * Обнаруживает паттерны пропущенных намазов
   * (В будущем можно добавить анализ истории, пока возвращаем базовые рекомендации)
   */
  detectMissedPrayerPatterns(debt: UserPrayerDebt): PrayerPattern[] {
    const { missed_prayers, completed_prayers } = debt.debt_calculation;
    const patterns: PrayerPattern[] = [];

    const prayers = [
      { key: "fajr", name: "Фаджр" },
      { key: "dhuhr", name: "Зухр" },
      { key: "asr", name: "Аср" },
      { key: "maghrib", name: "Магриб" },
      { key: "isha", name: "Иша" },
      { key: "witr", name: "Витр" }
    ] as const;

    for (const prayer of prayers) {
      const missed = missed_prayers[prayer.key];
      const completed = completed_prayers[prayer.key] || 0;
      const progress = missed > 0 ? (completed / missed) * 100 : 100;

      // Если прогресс меньше 50% и осталось много
      if (progress < 50 && missed - completed > 10) {
        patterns.push({
          prayer: prayer.name,
          missedCount: missed - completed,
          trend: "stable",
          recommendation: `Вы часто пропускаете ${prayer.name}. Настройте напоминание или добавьте ${prayer.name} в ваш ежедневный план восполнения.`
        });
      }
    }

    return patterns;
  }
}

