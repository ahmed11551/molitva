import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import ProgressBar from '../components/ProgressBar';
import Button from '../components/Button';
import StatRow from '../components/StatRow';
import './GoalsTab.css';

interface Goal {
  id: string;
  type: 'monthly_repayment' | 'daily_repayment' | 'milestone';
  target_amount: number;
  current_amount: number;
  period_start: string;
  period_end: string;
  status: 'active' | 'completed' | 'failed';
}

interface GoalProgress {
  goal: Goal;
  progress_percent: number;
  remaining: number;
  days_remaining: number;
  estimated_completion_date?: string;
}

export default function GoalsTab() {
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const response = await api.get('/goals');
      setGoals(response.data.progress || []);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Нет целей - это нормально
        setGoals([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAutoGoal = async () => {
    try {
      await api.post('/goals/auto-monthly');
      await loadGoals();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка создания цели');
    }
  };

  if (loading) {
    return <LoadingState message="Загрузка целей..." />;
  }

  return (
    <div className="goals-tab">
      <SectionHeader
        title="Мои цели"
        icon="🎯"
        subtitle="Отслеживайте прогресс восполнения намазов"
      />

      {goals.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="Нет активных целей"
          description="Создайте автоматическую месячную цель для отслеживания прогресса"
          actionLabel="Создать месячную цель"
          onAction={handleCreateAutoGoal}
        />
      ) : (
        <>
          {goals.map((goalProgress) => {
            const { goal, progress_percent, remaining, days_remaining } = goalProgress;
            const goalTypeNames: Record<string, string> = {
              monthly_repayment: 'Месячная цель',
              daily_repayment: 'Ежедневная цель',
              milestone: 'Милстоун',
            };

            return (
              <Card key={goal.id} variant="elevated" padding="large" className="goal-card">
                <div className="goal-header">
                  <h3>{goalTypeNames[goal.type] || goal.type}</h3>
                  <span className={`goal-status goal-status-${goal.status}`}>
                    {goal.status === 'active' ? 'Активна' : goal.status === 'completed' ? 'Выполнена' : 'Провалена'}
                  </span>
                </div>

                <ProgressBar
                  value={goal.current_amount}
                  max={goal.target_amount}
                  showLabel
                  label={`${progress_percent}% (${goal.current_amount.toLocaleString()}/${goal.target_amount.toLocaleString()})`}
                  size="large"
                  color={goal.status === 'completed' ? 'success' : 'primary'}
                />

                <div className="goal-stats">
                  <StatRow
                    label="Осталось"
                    value={remaining.toLocaleString()}
                    icon="⏳"
                  />
                  <StatRow
                    label="Дней до окончания"
                    value={days_remaining.toString()}
                    icon="📅"
                  />
                  {goalProgress.estimated_completion_date && (
                    <StatRow
                      label="Ожидаемое завершение"
                      value={new Date(goalProgress.estimated_completion_date).toLocaleDateString('ru-RU')}
                      icon="📊"
                    />
                  )}
                </div>
              </Card>
            );
          })}

          <Button
            variant="outline"
            size="large"
            fullWidth
            onClick={handleCreateAutoGoal}
            icon="➕"
          >
            Создать новую цель
          </Button>
        </>
      )}
    </div>
  );
}

