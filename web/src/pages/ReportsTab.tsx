import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import type { UserPrayerDebt } from '../types';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import StatRow from '../components/StatRow';
import Button from '../components/Button';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import ProgressChart from '../components/ProgressChart';
import './ReportsTab.css';

interface ProgressDataPoint {
  date: string;
  completed: number;
  total: number;
}

export default function ReportsTab() {
  const [debt, setDebt] = useState<UserPrayerDebt | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [progressHistory, setProgressHistory] = useState<ProgressDataPoint[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadSnapshot();
  }, []);

  useEffect(() => {
    if (debt) {
      loadProgressHistory();
    }
  }, [debt]);

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

  const loadProgressHistory = async () => {
    if (!debt) return;

    try {
      const response = await api.get('/prayer-debt/progress-history', {
        params: {
          start_date: debt.debt_calculation.period.start.split('T')[0],
          end_date: debt.debt_calculation.period.end.split('T')[0],
        },
      });
      setProgressHistory(response.data.history || []);
    } catch (error: any) {
      console.error('Failed to load progress history:', error);
      // Продолжаем без истории
    }
  };

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const response = await api.get('/prayer-debt/report.pdf');
      if (response.data.url) {
        window.open(response.data.url, '_blank');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка генерации PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleShare = async () => {
    if (!debt) return;

    const { missed_prayers, completed_prayers } = debt.debt_calculation;
    const total = Object.values(missed_prayers).reduce((a, b) => a + b, 0);
    const completed = Object.values(completed_prayers).reduce((a, b) => a + b, 0);
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const shareText = `🕌 Мой прогресс по каза-намазам\n\n` +
      `✅ Восполнено: ${completed.toLocaleString()} из ${total.toLocaleString()} намазов\n` +
      `📊 Прогресс: ${percent}%\n\n` +
      `Пусть Аллах примет наши молитвы! 🤲`;

    // Используем Web Share API если доступен
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Мой прогресс по каза-намазам',
          text: shareText,
        });
      } catch (err: any) {
        // Пользователь отменил шаринг или произошла ошибка
        if (err.name !== 'AbortError') {
          console.error('Share error:', err);
        }
      }
    } else {
      // Fallback: копируем в буфер обмена
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Текст скопирован в буфер обмена!');
      } catch (err) {
        // Если clipboard API недоступен, показываем текст
        prompt('Скопируйте текст:', shareText);
      }
    }
  };

  if (loading) {
    return <LoadingState message="Загрузка отчёта..." />;
  }

  if (!debt) {
    return (
      <EmptyState
        icon="📈"
        title="Расчёт не выполнен"
        description="Для просмотра отчёта необходимо выполнить расчёт пропущенных намазов"
        actionLabel="Перейти к расчёту"
        onAction={() => navigate('/')}
      />
    );
  }

  const { missed_prayers, completed_prayers, period } = debt.debt_calculation;
  const total = Object.values(missed_prayers).reduce((a, b) => a + b, 0);
  const completed = Object.values(completed_prayers).reduce((a, b) => a + b, 0);
  const remaining = total - completed;
  
  // Рассчитываем реальный темп на основе истории
  let speed = 0;
  if (progressHistory.length > 1) {
    const first = progressHistory[0];
    const last = progressHistory[progressHistory.length - 1];
    const daysDiff = Math.max(1, Math.floor(
      (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24)
    ));
    const progressDiff = last.completed - first.completed;
    speed = Math.round(progressDiff / daysDiff);
  } else {
    // Fallback: рассчитываем по общему прогрессу
    const daysSinceStart = Math.floor(
      (new Date().getTime() - new Date(period.start).getTime()) / (1000 * 60 * 60 * 24)
    );
    speed = daysSinceStart > 0 ? Math.round(completed / daysSinceStart) : 0;
  }

  return (
    <div className="reports-tab">
      <SectionHeader
        title="Ваш духовный путь"
        icon="📈"
      />

      <Card variant="elevated" padding="large">
        <div className="report-stats">
          <StatRow
            label="Дата начала"
            value={new Date(period.start).toLocaleDateString('ru-RU')}
            icon="📅"
          />
          <StatRow
            label="Всего восполнено"
            value={`${completed.toLocaleString()} намазов`}
            icon="✅"
            highlight
          />
          <StatRow
            label="Осталось"
            value={remaining.toLocaleString()}
            icon="⏳"
          />
          <StatRow
            label="Скорость"
            value={`${speed} намазов/день`}
            icon="⚡"
          />
        </div>
      </Card>

      <Card variant="elevated" padding="large">
        <ProgressChart
          data={progressHistory}
          periodStart={period.start}
          periodEnd={period.end}
        />
      </Card>

      <div className="report-actions">
        <Button
          variant="secondary"
          size="large"
          fullWidth
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
          loading={pdfLoading}
          icon="📄"
        >
          Скачать PDF
        </Button>
        <Button
          variant="secondary"
          size="large"
          fullWidth
          onClick={handleShare}
          icon="📤"
        >
          Поделиться с наставником
        </Button>
      </div>

      <Card variant="outlined" padding="medium" className="disclaimer">
        <p>
          <strong>Примечание:</strong> Расчёт выполнен по методике{' '}
          {debt.madhab === 'hanafi' ? 'ханафитского' : 'шафиитского'} мазхаба.
          {debt.madhab === 'hanafi' && ' Витр включён в долг.'}
        </p>
      </Card>
    </div>
  );
}

