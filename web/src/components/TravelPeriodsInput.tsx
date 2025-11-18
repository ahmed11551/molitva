import { useState } from 'react';
import Button from './Button';
import FormField from './FormField';
import Card from './Card';
import ErrorMessage from './ErrorMessage';
import './TravelPeriodsInput.css';

interface TravelPeriod {
  start_date: string;
  end_date: string;
  days_count: number;
}

interface TravelPeriodsInputProps {
  periods: TravelPeriod[];
  onChange: (periods: TravelPeriod[]) => void;
  totalDays: number;
  onTotalDaysChange: (days: number) => void;
}

export default function TravelPeriodsInput({
  periods,
  onChange,
  totalDays,
  onTotalDaysChange,
}: TravelPeriodsInputProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addPeriod = () => {
    const newPeriod: TravelPeriod = {
      start_date: '',
      end_date: '',
      days_count: 0,
    };
    onChange([...periods, newPeriod]);
  };

  const removePeriod = (index: number) => {
    const newPeriods = periods.filter((_, i) => i !== index);
    onChange(newPeriods);
    // Пересчитываем общее количество дней
    const calculatedTotal = newPeriods.reduce((sum, p) => sum + p.days_count, 0);
    onTotalDaysChange(calculatedTotal);
    setErrors({});
  };

  const updatePeriod = (index: number, field: keyof TravelPeriod, value: string | number) => {
    const newPeriods = [...periods];
    const period = { ...newPeriods[index], [field]: value };

    // Автоматически рассчитываем количество дней
    if (field === 'start_date' || field === 'end_date') {
      if (period.start_date && period.end_date) {
        const start = new Date(period.start_date);
        const end = new Date(period.end_date);
        if (end >= start) {
          period.days_count = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        } else {
          period.days_count = 0;
        }
      }
    }

    newPeriods[index] = period;
    onChange(newPeriods);

    // Валидация пересечений
    const validationError = validatePeriods(newPeriods);
    setErrors(validationError);

    // Пересчитываем общее количество дней
    const calculatedTotal = newPeriods.reduce((sum, p) => sum + p.days_count, 0);
    onTotalDaysChange(calculatedTotal);
  };

  const validatePeriods = (periodsToValidate: TravelPeriod[]): Record<string, string> => {
    const errors: Record<string, string> = {};

    for (let i = 0; i < periodsToValidate.length; i++) {
      const period = periodsToValidate[i];
      const key = `period_${i}`;

      if (!period.start_date || !period.end_date) {
        continue; // Пропускаем незаполненные периоды
      }

      const start = new Date(period.start_date);
      const end = new Date(period.end_date);

      if (end < start) {
        errors[key] = 'Дата окончания не может быть раньше даты начала';
        continue;
      }

      // Проверка пересечений с другими периодами
      for (let j = i + 1; j < periodsToValidate.length; j++) {
        const otherPeriod = periodsToValidate[j];
        if (!otherPeriod.start_date || !otherPeriod.end_date) {
          continue;
        }

        const otherStart = new Date(otherPeriod.start_date);
        const otherEnd = new Date(otherPeriod.end_date);

        // Проверяем пересечение
        if (
          (start <= otherEnd && end >= otherStart) ||
          (otherStart <= end && otherEnd >= start)
        ) {
          errors[key] = `Пересекается с периодом ${j + 1}`;
          errors[`period_${j}`] = `Пересекается с периодом ${i + 1}`;
        }
      }
    }

    return errors;
  };

  return (
    <div className="travel-periods-input">
      <FormField
        label="Общее количество дней в пути"
        hint="Можно указать вручную или добавить периоды ниже для автоматического расчёта"
      >
        <input
          type="number"
          min="0"
          value={totalDays}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 0;
            onTotalDaysChange(value);
          }}
        />
      </FormField>

      <div className="periods-section">
        <div className="periods-header">
          <h3>Периоды путешествий</h3>
          <Button variant="outline" size="small" onClick={addPeriod} icon="➕">
            Добавить период
          </Button>
        </div>

        {periods.length === 0 && (
          <p className="periods-hint">
            Добавьте периоды путешествий для точного расчёта. Количество дней будет рассчитано автоматически.
          </p>
        )}

        {periods.map((period, index) => (
          <Card key={index} variant="outlined" padding="medium" className="period-card">
            <div className="period-header">
              <h4>Период {index + 1}</h4>
              <Button
                variant="ghost"
                size="small"
                onClick={() => removePeriod(index)}
                icon="🗑️"
              >
                Удалить
              </Button>
            </div>

            {errors[`period_${index}`] && (
              <ErrorMessage message={errors[`period_${index}`]} />
            )}

            <div className="period-fields">
              <FormField label="Дата начала" htmlFor={`start_${index}`}>
                <input
                  id={`start_${index}`}
                  type="date"
                  value={period.start_date}
                  onChange={(e) => updatePeriod(index, 'start_date', e.target.value)}
                />
              </FormField>

              <FormField label="Дата окончания" htmlFor={`end_${index}`}>
                <input
                  id={`end_${index}`}
                  type="date"
                  value={period.end_date}
                  onChange={(e) => updatePeriod(index, 'end_date', e.target.value)}
                  min={period.start_date || undefined}
                />
              </FormField>

              <FormField label="Дней" htmlFor={`days_${index}`}>
                <input
                  id={`days_${index}`}
                  type="number"
                  min="0"
                  value={period.days_count}
                  onChange={(e) => updatePeriod(index, 'days_count', parseInt(e.target.value) || 0)}
                  readOnly
                  className="readonly"
                />
              </FormField>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

