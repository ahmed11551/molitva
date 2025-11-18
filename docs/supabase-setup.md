# Настройка Supabase

## 1. Создание проекта

1. Зайдите на [supabase.com](https://supabase.com) и создайте новый проект
2. Запишите:
   - Project URL (например: `https://xxxxx.supabase.co`)
   - Anon/Public Key (из Settings → API)
   - Service Role Key (из Settings → API, для backend операций)

## 2. Применение миграций

✅ **Миграции уже применены автоматически через Supabase MCP!**

Таблицы созданы:
- `prayer_debts` — расчёты долга пользователей
- `calculation_jobs` — асинхронные задачи
- `audit_log` — логи изменений

Индексы и триггеры настроены, RLS политики включены.

### Если нужно применить вручную:

#### Вариант A: Через Supabase Dashboard

1. Откройте SQL Editor в Supabase Dashboard
2. Скопируйте содержимое `supabase/migrations/001_initial_schema.sql`
3. Выполните SQL запрос

#### Вариант B: Через Supabase CLI

```bash
# Установите Supabase CLI
npm install -g supabase

# Инициализируйте проект (если еще не сделано)
supabase init

# Примените миграции
supabase db push
```

## 3. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# E-Replika (опционально)
EREPLIKA_BASE_URL=https://bot.e-replika.ru
EREPLIKA_API_KEY=test_token_123

# Приложение
PORT=4000
CALC_VERSION=1.0.0
```

## 4. Проверка подключения

После запуска приложения (`npm run dev`) проверьте логи:

- ✅ `Supabase client initialized` — подключение успешно
- ⚠️ `Using in-memory storage` — Supabase не настроен, используется fallback

## 5. Row Level Security (RLS)

✅ **RLS политики настроены автоматически!**

Текущие политики:
- Доступ для роли `authenticated` (через Supabase Auth)
- Backend использует `SUPABASE_SERVICE_ROLE_KEY` (обходит RLS для сервисных операций)

Для production:
1. Настройте аутентификацию через Supabase Auth (если используете)
2. При необходимости обновите политики под вашу модель авторизации
3. Для сервисных операций используйте `SUPABASE_SERVICE_ROLE_KEY` (обходит RLS)

## 6. Структура таблиц

### `prayer_debts`
- Хранит расчёты долга пользователей
- `user_id` — уникальный идентификатор пользователя
- JSONB поля для гибкого хранения структурированных данных

### `calculation_jobs`
- Асинхронные задачи расчёта
- Статусы: `pending`, `done`, `error`

### `audit_log`
- Логи всех изменений
- Для отладки и аудита
- Автоматически заполняется через `AuditLogger` при:
  - Создании/обновлении расчёта долга
  - Обновлении прогресса восполнения
  - Создании/завершении/ошибке асинхронных задач
  - Запросе PDF отчёта

## 7. Резервное копирование

Supabase автоматически создаёт бэкапы. Для ручного экспорта:

```bash
supabase db dump -f backup.sql
```

## Troubleshooting

### Ошибка подключения
- Проверьте `SUPABASE_URL` и `SUPABASE_ANON_KEY`
- Убедитесь, что проект активен в Supabase Dashboard

### RLS блокирует запросы
- Используйте `SUPABASE_SERVICE_ROLE_KEY` для backend операций
- Или обновите RLS политики под вашу модель авторизации

### Миграции не применяются
- Проверьте права доступа к базе данных
- Убедитесь, что SQL синтаксис корректен

