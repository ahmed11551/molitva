import { useState } from 'react';
import Button from './Button';
import Card from './Card';
import './ConsentModal.css';

interface ConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function ConsentModal({ isOpen, onAccept, onDecline }: ConsentModalProps) {
  const [read, setRead] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="consent-modal-overlay">
      <Card variant="elevated" padding="large" className="consent-modal-content">
        <div className="consent-header">
          <span className="consent-icon">🔒</span>
          <h2>Согласие на обработку персональных данных</h2>
        </div>

        <div className="consent-content">
          <p>
            Для работы приложения нам необходимо обработать ваши персональные данные:
          </p>
          <ul>
            <li>Дата рождения — для расчёта периода с момента совершеннолетия</li>
            <li>Пол — для учёта женских периодов (хайд, нифас)</li>
            <li>Данные о путешествиях — для расчёта сафар-намазов</li>
            <li>Прогресс восполнения намазов — для отслеживания и формирования отчётов</li>
          </ul>
          <p>
            <strong>Важно:</strong> Мы храним только агрегированные данные (количество намазов),
            без истории реальных молитв. Все данные хранятся в зашифрованном виде и используются
            исключительно для расчёта и отслеживания вашего долга по намазам.
          </p>
          <p>
            Нажимая "Принять", вы даёте согласие на обработку персональных данных в соответствии
            с политикой конфиденциальности.
          </p>
        </div>

        <div className="consent-checkbox">
          <label>
            <input
              type="checkbox"
              checked={read}
              onChange={(e) => setRead(e.target.checked)}
            />
            <span>Я прочитал(а) и согласен(на) с условиями обработки данных</span>
          </label>
        </div>

        <div className="consent-actions">
          <Button
            variant="outline"
            onClick={onDecline}
            fullWidth
          >
            Отклонить
          </Button>
          <Button
            variant="primary"
            onClick={onAccept}
            disabled={!read}
            fullWidth
          >
            Принять
          </Button>
        </div>
      </Card>
    </div>
  );
}

