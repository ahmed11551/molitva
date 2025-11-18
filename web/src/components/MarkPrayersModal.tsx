import { useState } from 'react';
import api from '../utils/api';
import Button from './Button';
import './MarkPrayersModal.css';

interface MarkPrayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availablePrayers: {
    fajr?: number;
    dhuhr?: number;
    asr?: number;
    maghrib?: number;
    isha?: number;
    witr?: number;
    dhuhr_safar?: number;
    asr_safar?: number;
    isha_safar?: number;
  };
}

const PRAYER_NAMES: Record<string, string> = {
  fajr: '🕯 Фаджр',
  dhuhr: '☀️ Зухр',
  asr: '🌇 Аср',
  maghrib: '🌆 Магриб',
  isha: '🌃 Иша',
  witr: '✨ Витр',
  dhuhr_safar: '✈️ Зухр (сафар)',
  asr_safar: '✈️ Аср (сафар)',
  isha_safar: '✈️ Иша (сафар)',
};

export default function MarkPrayersModal({
  isOpen,
  onClose,
  onSuccess,
  availablePrayers,
}: MarkPrayersModalProps) {
  const [entries, setEntries] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (prayerType: string, delta: number) => {
    setEntries((prev) => ({
      ...prev,
      [prayerType]: (prev[prayerType] || 0) + delta,
    }));
    setError(null);
  };

  const handleSubmit = async () => {
    const formattedEntries = Object.entries(entries)
      .filter(([_, amount]) => amount !== 0)
      .map(([type, amount]) => ({ type, amount }));

    if (formattedEntries.length === 0) {
      setError('Выберите хотя бы один намаз для отметки');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.patch('/prayer-debt/progress', { entries: formattedEntries });
      onSuccess();
      onClose();
      setEntries({});
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  const totalChanges = Object.values(entries).reduce((sum, val) => sum + val, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Отметить восполненные намазы</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <div className="prayers-list">
            {Object.entries(availablePrayers).map(([key, remaining]) => {
              if (remaining === undefined || remaining <= 0) return null;
              const current = entries[key] || 0;

              return (
                <div key={key} className="prayer-counter">
                  <div className="prayer-label">
                    <span>{PRAYER_NAMES[key] || key}</span>
                    <span className="remaining">Осталось: {remaining}</span>
                  </div>
                  <div className="counter-controls">
                    <button
                      type="button"
                      className="counter-btn"
                      onClick={() => handleChange(key, -1)}
                      disabled={current <= 0}
                    >
                      −
                    </button>
                    <span className="counter-value">{current}</span>
                    <button
                      type="button"
                      className="counter-btn"
                      onClick={() => handleChange(key, 1)}
                      disabled={current >= remaining}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalChanges > 0 && (
            <div className="total-changes">
              Всего будет добавлено: <strong>+{totalChanges}</strong> намазов
            </div>
          )}
        </div>

        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose} disabled={loading} fullWidth>
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || totalChanges === 0}
            loading={loading}
            fullWidth
          >
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
}

