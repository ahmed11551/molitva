import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import type { UserPrayerDebt } from '../types';
import MarkPrayersModal from '../components/MarkPrayersModal';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import PrayerProgressItem from '../components/PrayerProgressItem';
import Button from '../components/Button';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import './TravelPrayersTab.css';

export default function TravelPrayersTab() {
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
        icon="✈️"
        title="Расчёт не выполнен"
        description="Для отслеживания сафар-намазов необходимо выполнить расчёт"
        actionLabel="Перейти к расчёту"
        onAction={() => navigate('/')}
      />
    );
  }

  const { travel_prayers } = debt.debt_calculation;
  const { completed_travel_prayers } = debt.repayment_progress;

  const travelPrayers = [
    { key: 'dhuhr_safar', name: 'Зухр (сафар)', icon: '✈️' },
    { key: 'asr_safar', name: 'Аср (сафар)', icon: '✈️' },
    { key: 'isha_safar', name: 'Иша (сафар)', icon: '✈️' },
  ];

  return (
    <div className="travel-prayers-tab">
      <Card variant="outlined" padding="medium" className="info-box">
        <p>
          Во время путешествия (сафар) некоторые намазы можно сокращать (кыср).
          Здесь отображается прогресс восполнения сафар-намазов.
        </p>
      </Card>

      <Card variant="elevated" padding="large">
        <SectionHeader
          title="Сафар-намазы"
          icon="✈️"
        />
        <div className="travel-prayers-list">
          {travelPrayers.map(({ key, name, icon }) => {
            const total = travel_prayers[key as keyof typeof travel_prayers] || 0;
            const completed =
              completed_travel_prayers[key as keyof typeof completed_travel_prayers] || 0;

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
        Отметить сафар-намазы
      </Button>

      <MarkPrayersModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadSnapshot}
        availablePrayers={getAvailableTravelPrayers(travel_prayers, completed_travel_prayers)}
      />
    </div>
  );
}

function getAvailableTravelPrayers(
  travel: UserPrayerDebt['debt_calculation']['travel_prayers'],
  completed: UserPrayerDebt['repayment_progress']['completed_travel_prayers']
) {
  const available: Record<string, number> = {};
  
  Object.entries(travel).forEach(([key, total]) => {
    const completedCount = completed[key as keyof typeof completed] || 0;
    const remaining = total - completedCount;
    if (remaining > 0) {
      available[key] = remaining;
    }
  });

  return available;
}

