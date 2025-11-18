import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import type { UserPrayerDebt } from '../types';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import StatRow from '../components/StatRow';
import AchievementCard from '../components/AchievementCard';
import './RepaymentPlanTab.css';

interface RepaymentPlan {
  suggestions: Array<{
    time: string;
    prayer: string;
    amount: number;
    description: string;
  }>;
  dailyRate: number;
  estimatedDays: number;
  milestones: Array<{
    target: number;
    message: string;
    achieved: boolean;
  }>;
}

interface MotivationalMessage {
  text: string;
  source?: string;
  type: string;
}

export default function RepaymentPlanTab() {
  const [debt, setDebt] = useState<UserPrayerDebt | null>(null);
  const [plan, setPlan] = useState<RepaymentPlan | null>(null);
  const [message, setMessage] = useState<MotivationalMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [snapshotRes, planRes, messageRes] = await Promise.all([
        api.get('/prayer-debt/snapshot').catch(() => null),
        api.get('/ai/repayment-plan').catch(() => null),
        api.get('/ai/motivational-message').catch(() => null)
      ]);

      if (snapshotRes) {
        setDebt(snapshotRes.data);
      }
      if (planRes) {
        setPlan(planRes.data);
      }
      if (messageRes) {
        setMessage(messageRes.data);
      }

      if (!snapshotRes || snapshotRes.status === 404) {
        navigate('/');
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Загрузка плана..." />;
  }

  if (!debt) {
    return (
      <EmptyState
        icon="📊"
        title="Расчёт не выполнен"
        description="Для просмотра плана восполнения необходимо выполнить расчёт пропущенных намазов"
        actionLabel="Перейти к расчёту"
        onAction={() => navigate('/')}
      />
    );
  }

  const { missed_prayers, completed_prayers } = debt.debt_calculation;
  const total = Object.values(missed_prayers).reduce((a, b) => a + b, 0);
  const completed = Object.values(completed_prayers).reduce((a, b) => a + b, 0);
  const remaining = total - completed;

  // Используем данные из AI или fallback
  const dailyRate = plan?.dailyRate || 10;
  const estimatedDays = plan?.estimatedDays || Math.ceil(remaining / dailyRate);
  const months = Math.floor(estimatedDays / 30);
  const days = estimatedDays % 30;

  const iconMap: Record<string, string> = {
    'После Фаджра': '🌅',
    'После Асра': '🌆',
    'В выходные': '📅'
  };

  return (
    <div className="repayment-plan-tab">
      <SectionHeader
        title="AI-план восполнения"
        icon="🤖"
      />

      <Card variant="elevated" padding="large">
        <div className="plan-suggestions">
          {plan?.suggestions.map((suggestion, idx) => (
            <div key={idx} className="suggestion-item">
              <span className="suggestion-icon">
                {iconMap[suggestion.time] || '📿'}
              </span>
              <div>
                <strong>{suggestion.time} — +{suggestion.amount} каза</strong>
                <p className="suggestion-desc">{suggestion.description}</p>
              </div>
            </div>
          )) || (
            <>
              <div className="suggestion-item">
                <span className="suggestion-icon">🌅</span>
                <span>После Фаджра — +1 каза</span>
              </div>
              <div className="suggestion-item">
                <span className="suggestion-icon">🌆</span>
                <span>После Асра — +2 каза</span>
              </div>
              <div className="suggestion-item">
                <span className="suggestion-icon">📅</span>
                <span>В выходные — +5 каза</span>
              </div>
            </>
          )}
        </div>
      </Card>

      <Card variant="elevated" padding="large">
        <StatRow
          label="Текущий темп"
          value={`${dailyRate} намазов/день`}
          icon="⚡"
        />
        <StatRow
          label="Осталось"
          value={remaining.toLocaleString()}
          icon="⏳"
        />
      </Card>

      <Card variant="elevated" padding="large">
        <SectionHeader
          title="До полного закрытия"
          icon="⏱"
        />
        <div className="eta-display">
          {months > 0 && <span className="eta-value">{months} мес.</span>}
          <span className="eta-value">{days} дней</span>
        </div>
      </Card>

      {/* Достигнутые милстоуны с кнопкой поделиться */}
      {plan?.milestones && plan.milestones.filter(m => m.achieved).length > 0 && (
        <div className="achievements-section">
          <SectionHeader
            title="🎉 Ваши достижения"
            icon="🏆"
            subtitle="Поделитесь своими успехами!"
          />
          {plan.milestones
            .filter(m => m.achieved)
            .slice(-3) // Показываем последние 3 достижения
            .map((milestone, idx) => (
              <AchievementCard
                key={idx}
                title={`Достижение: ${milestone.target} намазов`}
                message={milestone.message}
                target={milestone.target}
                completed={completed}
              />
            ))}
        </div>
      )}

      {/* Ближайшие цели */}
      {plan?.milestones && plan.milestones.some(m => !m.achieved) && (
        <Card variant="outlined" padding="medium">
          <h3 className="milestones-title">🎯 Ближайшие цели</h3>
          {plan.milestones
            .filter(m => !m.achieved)
            .slice(0, 2)
            .map((milestone, idx) => (
              <div key={idx} className="milestone-item">
                <span className="milestone-target">{milestone.target} намазов</span>
                <span className="milestone-message">{milestone.message}</span>
              </div>
            ))}
        </Card>
      )}

      <Card variant="outlined" padding="medium" className="motivational-message">
        <p>{message?.text || "И совершайте намаз, и давайте закят, и повинуйтесь Посланнику, — быть может, вы будете помилованы"}</p>
        <p className="verse-ref">{message?.source || "Коран, 24:56"}</p>
      </Card>
    </div>
  );
}

