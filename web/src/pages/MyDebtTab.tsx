import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import type { UserPrayerDebt } from '../types';
import MarkPrayersModal from '../components/MarkPrayersModal';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import ProgressBar from '../components/ProgressBar';
import PrayerProgressItem from '../components/PrayerProgressItem';
import Button from '../components/Button';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import './MyDebtTab.css';

export default function MyDebtTab() {
  const [debt, setDebt] = useState<UserPrayerDebt | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadSnapshot();
  }, []);

  const loadSnapshot = async () => {
    try {
      const response = await api.get('/prayer-debt/snapshot');
      setDebt(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Загрузка данных..." />;
  }

  if (!debt) {
    return (
      <EmptyState
        icon="📊"
        title="Расчёт не выполнен"
        description="Для начала работы необходимо выполнить расчёт пропущенных намазов"
        actionLabel="Перейти к расчёту"
        onAction={() => navigate('/')}
      />
    );
  }

  const { missed_prayers, completed_prayers } = debt.debt_calculation;
  const progress = calculateProgress(missed_prayers, completed_prayers);

  return (
    <div className="my-debt-tab">
      <Card variant="elevated" padding="large">
        <SectionHeader
          title="Общий прогресс"
          icon="📊"
        />
        <ProgressBar
          value={progress.completed}
          max={progress.total}
          showLabel
          label={`${progress.overall}% (${progress.completed.toLocaleString()}/${progress.total.toLocaleString()})`}
          size="large"
          color="primary"
        />
      </Card>

      <Card variant="elevated" padding="large" className="prayers-progress-card">
        <SectionHeader
          title="По намазам"
          icon="🕌"
        />
        <div className="prayers-list">
          {Object.entries(missed_prayers).map(([key, total]) => {
            const completed = completed_prayers[key as keyof typeof completed_prayers] || 0;
            const icon = getPrayerIcon(key);
            const name = getPrayerName(key);

            return (
              <PrayerProgressItem
                key={key}
                icon={icon}
                name={name}
                completed={completed}
                total={total}
              />
            );
          })}
        </div>
      </Card>

      <Button
        variant="primary"
        size="large"
        fullWidth
        onClick={() => setModalOpen(true)}
        icon="➕"
      >
        Отметить восполненные намазы
      </Button>

      <MarkPrayersModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadSnapshot}
        availablePrayers={getAvailablePrayers(missed_prayers, completed_prayers)}
      />
    </div>
  );
}

function getAvailablePrayers(
  missed: UserPrayerDebt['debt_calculation']['missed_prayers'],
  completed: UserPrayerDebt['debt_calculation']['completed_prayers']
) {
  const available: Record<string, number> = {};
  
  Object.entries(missed).forEach(([key, total]) => {
    const completedCount = completed[key as keyof typeof completed] || 0;
    const remaining = total - completedCount;
    if (remaining > 0) {
      available[key] = remaining;
    }
  });

  return available;
}

function calculateProgress(
  missed: UserPrayerDebt['debt_calculation']['missed_prayers'],
  completed: UserPrayerDebt['debt_calculation']['completed_prayers']
) {
  const totals = Object.values(missed);
  const completedTotals = Object.values(completed);
  const total = totals.reduce((a, b) => a + b, 0);
  const completedSum = completedTotals.reduce((a, b) => a + b, 0);
  return {
    total,
    completed: completedSum,
    overall: total > 0 ? Math.round((completedSum / total) * 100) : 0,
  };
}

function getPrayerIcon(key: string): string {
  const icons: Record<string, string> = {
    fajr: '🕯',
    dhuhr: '☀️',
    asr: '🌇',
    maghrib: '🌆',
    isha: '🌃',
    witr: '✨',
  };
  return icons[key] || '🕌';
}

function getPrayerName(key: string): string {
  const names: Record<string, string> = {
    fajr: 'Фаджр',
    dhuhr: 'Зухр',
    asr: 'Аср',
    maghrib: 'Магриб',
    isha: 'Иша',
    witr: 'Витр',
  };
  return names[key] || key;
}

