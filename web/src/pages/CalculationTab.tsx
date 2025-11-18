import { useState } from 'react';
import api from '../utils/api';
import type { CalculationInput } from '../types';
import ErrorMessage from '../components/ErrorMessage';
import FormField from '../components/FormField';
import Button from '../components/Button';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import TravelPeriodsInput from '../components/TravelPeriodsInput';
import './CalculationTab.css';

export default function CalculationTab() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CalculationInput>({
    calculation_method: 'manual',
    madhab: 'hanafi',
    personal_data: {
      birth_date: '',
      gender: 'male',
      bulugh_age: 15,
      today_as_start: true,
    },
    women_data: {
      haid_days_per_month: 7,
      childbirth_count: 0,
      nifas_days_per_childbirth: 40,
    },
    travel_data: {
      total_travel_days: 0,
      travel_periods: [],
    },
  });

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.personal_data.birth_date) {
      errors.birth_date = 'Дата рождения обязательна';
    } else {
      const birthDate = new Date(formData.personal_data.birth_date);
      const today = new Date();
      if (birthDate >= today) {
        errors.birth_date = 'Дата рождения должна быть в прошлом';
      }
    }

    if (!formData.personal_data.today_as_start && !formData.personal_data.prayer_start_date) {
      errors.prayer_start_date = 'Укажите дату начала молитв или выберите "С сегодняшнего дня"';
    }

    if (formData.personal_data.gender === 'female') {
      if (formData.women_data?.haid_days_per_month && 
          (formData.women_data.haid_days_per_month < 1 || formData.women_data.haid_days_per_month > 15)) {
        errors.haid_days = 'Количество дней хайда должно быть от 1 до 15';
      }
      if (formData.women_data?.childbirth_count && formData.women_data.childbirth_count < 0) {
        errors.childbirth_count = 'Количество родов не может быть отрицательным';
      }
    }

    if (formData.travel_data?.total_travel_days && formData.travel_data.total_travel_days < 0) {
      errors.travel_days = 'Количество дней в пути не может быть отрицательным';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/prayer-debt/calculate', formData);
      setResult(response.data);
      setError(null);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Ошибка расчёта. Попробуйте позже.';
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="calculation-tab">
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      
      <form onSubmit={handleSubmit} className="calculation-form">
        <Card variant="elevated" padding="large">
          <SectionHeader title="Личные данные" icon="📅" />
          
          <FormField
            label="Дата рождения"
            required
            error={validationErrors.birth_date}
            htmlFor="birth_date"
          >
            <input
              id="birth_date"
              type="date"
              required
              value={formData.personal_data.birth_date}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  personal_data: {
                    ...formData.personal_data,
                    birth_date: e.target.value,
                  },
                });
                if (validationErrors.birth_date) {
                  setValidationErrors({ ...validationErrors, birth_date: '' });
                }
              }}
            />
          </FormField>

          <div className="form-group">
            <label>Пол *</label>
            <select
              value={formData.personal_data.gender}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  personal_data: {
                    ...formData.personal_data,
                    gender: e.target.value as 'male' | 'female',
                  },
                })
              }
            >
              <option value="male">Мужской</option>
              <option value="female">Женский</option>
            </select>
          </div>

        <div className="form-group">
          <label>Мазхаб</label>
          <select
            value={formData.madhab || 'hanafi'}
            onChange={(e) =>
              setFormData({
                ...formData,
                madhab: e.target.value as 'hanafi' | 'shafii',
              })
            }
          >
            <option value="hanafi">Ханафи (витр обязателен)</option>
            <option value="shafii">Шафиитский (витр — нафиль)</option>
          </select>
          <small className="form-hint">
            В шафиитском мазхабе витр не считается обязательным и исключается из расчёта.
          </small>
        </div>

          <div className="form-group">
            <label>Возраст булюга (лет)</label>
            <input
              type="number"
              min="10"
              max="20"
              value={formData.personal_data.bulugh_age}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  personal_data: {
                    ...formData.personal_data,
                    bulugh_age: parseInt(e.target.value) || 15,
                  },
                })
              }
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.personal_data.today_as_start}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personal_data: {
                      ...formData.personal_data,
                      today_as_start: e.target.checked,
                      prayer_start_date: e.target.checked ? undefined : '',
                    },
                  })
                }
              />
              Считать с сегодняшнего дня
            </label>
          </div>

          {!formData.personal_data.today_as_start && (
            <div className="form-group">
              <label>Дата начала молитв</label>
              <input
                type="date"
                value={formData.personal_data.prayer_start_date || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personal_data: {
                      ...formData.personal_data,
                      prayer_start_date: e.target.value,
                    },
                  })
                }
              />
            </div>
          )}
        </div>

        {formData.personal_data.gender === 'female' && (
          <div className="form-section">
            <h2>🩸 Данные для женщин</h2>
            
            <div className="form-group">
              <label>Дней хайда в месяц</label>
              <input
                type="number"
                min="1"
                max="15"
                value={formData.women_data?.haid_days_per_month}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    women_data: {
                      ...formData.women_data,
                      haid_days_per_month: parseInt(e.target.value) || 7,
                    },
                  })
                }
              />
            </div>

            <div className="form-group">
              <label>Количество родов</label>
              <input
                type="number"
                min="0"
                value={formData.women_data?.childbirth_count}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    women_data: {
                      ...formData.women_data,
                      childbirth_count: parseInt(e.target.value) || 0,
                    },
                  })
                }
              />
            </div>
          </div>
        )}

        <Card variant="elevated" padding="large">
          <SectionHeader title="Путешествия" icon="✈️" />
          <TravelPeriodsInput
            periods={formData.travel_data?.travel_periods || []}
            onChange={(periods) =>
              setFormData({
                ...formData,
                travel_data: {
                  ...formData.travel_data,
                  travel_periods: periods,
                },
              })
            }
            totalDays={formData.travel_data?.total_travel_days || 0}
            onTotalDaysChange={(days) =>
              setFormData({
                ...formData,
                travel_data: {
                  ...formData.travel_data,
                  total_travel_days: days,
                },
              })
            }
          />
        </Card>

        <Button
          type="submit"
          variant="primary"
          size="large"
          fullWidth
          disabled={loading}
          loading={loading}
        >
          Рассчитать долг
        </Button>
      </form>

      {result && (
        <div className="calculation-result">
          <h2>Результат расчёта</h2>
          <div className="result-summary">
            <p>
              <strong>Период:</strong> {result.debt_calculation.period.start} —{' '}
              {result.debt_calculation.period.end}
            </p>
            <p>
              <strong>Эффективных дней:</strong>{' '}
              {result.debt_calculation.effective_days}
            </p>
            <p>
              <strong>Исключено дней:</strong>{' '}
              {result.debt_calculation.excluded_days}
            </p>
          </div>
          <div className="prayers-list">
            <h3>Пропущенные намазы:</h3>
            <ul>
              <li>🕯 Фаджр: {result.debt_calculation.missed_prayers.fajr}</li>
              <li>☀️ Зухр: {result.debt_calculation.missed_prayers.dhuhr}</li>
              <li>🌇 Аср: {result.debt_calculation.missed_prayers.asr}</li>
              <li>🌆 Магриб: {result.debt_calculation.missed_prayers.maghrib}</li>
              <li>🌃 Иша: {result.debt_calculation.missed_prayers.isha}</li>
              {result.madhab === 'hanafi' ? (
                <li>✨ Витр: {result.debt_calculation.missed_prayers.witr}</li>
              ) : (
                <li className="info-note">
                  ✨ Витр: не учитывается для шафиитского мазхаба
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

