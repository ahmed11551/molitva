import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import './PrayerCalendarTab.css';

interface PrayerTime {
  prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'witr';
  time: string;
  isKaza: boolean;
  reminder?: string;
}

interface CalendarDay {
  date: string;
  prayers: PrayerTime[];
  kazaCount: number;
}

const PRAYER_NAMES: Record<string, string> = {
  fajr: '🕯 Фаджр',
  dhuhr: '☀️ Зухр',
  asr: '🌇 Аср',
  maghrib: '🌆 Магриб',
  isha: '🌃 Иша',
  witr: '✨ Витр',
};

export default function PrayerCalendarTab() {
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysAhead, setDaysAhead] = useState(7);
  const navigate = useNavigate();

  useEffect(() => {
    loadCalendar();
  }, [daysAhead]);

  const loadCalendar = async () => {
    try {
      const response = await api.get('/prayer-calendar', {
        params: { days: daysAhead },
      });
      setCalendar(response.data.calendar || []);
    } catch (error: any) {
      if (error.response?.status === 404) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Загрузка календаря..." />;
  }

  if (calendar.length === 0) {
    return (
      <EmptyState
        icon="📅"
        title="Расчёт не выполнен"
        description="Для просмотра календаря необходимо выполнить расчёт пропущенных намазов"
        actionLabel="Перейти к расчёту"
        onAction={() => navigate('/')}
      />
    );
  }

  const totalKazaReminders = calendar.reduce((sum, day) => sum + day.kazaCount, 0);

  return (
    <div className="prayer-calendar-tab">
      <SectionHeader
        title="Календарь намазов"
        icon="📅"
        subtitle={`${totalKazaReminders} напоминаний о каза-намазах на ${daysAhead} дней`}
        action={
          <select
            value={daysAhead}
            onChange={(e) => setDaysAhead(Number(e.target.value))}
            className="days-select"
          >
            <option value={7}>7 дней</option>
            <option value={14}>14 дней</option>
            <option value={30}>30 дней</option>
          </select>
        }
      />

      <div className="calendar-list">
        {calendar.map((day, index) => {
          const date = new Date(day.date);
          const kazaPrayers = day.prayers.filter((p) => p.isKaza);

          return (
            <Card key={index} variant="elevated" padding="medium" className="calendar-day">
              <div className="day-header">
                <h3>{date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                {day.kazaCount > 0 && (
                  <span className="kaza-badge">{day.kazaCount} каза</span>
                )}
              </div>

              <div className="prayers-list">
                {day.prayers.map((prayer, pIndex) => (
                  <div
                    key={pIndex}
                    className={`prayer-item ${prayer.isKaza ? 'prayer-kaza' : ''}`}
                  >
                    <div className="prayer-time">
                      {new Date(prayer.time).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="prayer-name">{PRAYER_NAMES[prayer.prayer] || prayer.prayer}</div>
                    {prayer.isKaza && (
                      <div className="prayer-reminder">⚠️ {prayer.reminder}</div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

