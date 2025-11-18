# Инструкция по деплою

## Деплой на Vercel

### Вариант 1: Деплой через Vercel CLI

1. **Установите Vercel CLI**:
```bash
npm i -g vercel
```

2. **Войдите в Vercel**:
```bash
vercel login
```

3. **Деплой backend**:
```bash
cd .
vercel --prod
```

4. **Деплой frontend**:
```bash
cd web
vercel --prod
```

### Вариант 2: Деплой через GitHub

1. **Создайте репозиторий на GitHub**:
   - Перейдите на https://github.com/new
   - Создайте новый репозиторий (например, `prayer-debt-kaza`)

2. **Добавьте файлы в Git**:
```bash
git init
git add .
git commit -m "Initial commit: Prayer Debt Calculator"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/prayer-debt-kaza.git
git push -u origin main
```

3. **Подключите к Vercel**:
   - Перейдите на https://vercel.com
   - Нажмите "New Project"
   - Импортируйте репозиторий из GitHub
   - Настройте переменные окружения (см. ниже)

### Переменные окружения для Vercel

Добавьте следующие переменные в настройках проекта Vercel:

#### Backend (API):
```
PORT=4000
CALC_VERSION=1.0.0
MADHAB=hanafi

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# e-Replika
EREPLIKA_BASE_URL=https://bot.e-replika.ru
EREPLIKA_API_KEY=your_api_key
EREPLIKA_WEBHOOK_SECRET=your_webhook_secret
EREPLIKA_RETRY_ATTEMPTS=3
EREPLIKA_RETRY_DELAY=1000
API_BASE_URL=https://your-project.vercel.app

# Шифрование (опционально)
ENABLE_ENCRYPTION=false
ENCRYPTION_KEY=your_32_byte_key
```

#### Frontend:
```
VITE_API_URL=https://your-backend.vercel.app/api
```

### Структура деплоя

Рекомендуется деплоить backend и frontend отдельно:

1. **Backend** (API) - в корне проекта:
   - Root: `.` (корень репозитория)
   - Framework Preset: `Other`
   - Build Command: `npm install` (Vercel автоматически определит)
   - Output Directory: (не требуется для serverless)
   - Install Command: `npm install`
   - Файл конфигурации: `vercel.json`

2. **Frontend** (Web) - в папке `web`:
   - Root: `web`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
   - Файл конфигурации: `web/vercel.json`

### Настройка доменов

После деплоя:
1. Backend получит URL: `https://your-backend.vercel.app`
2. Frontend получит URL: `https://your-frontend.vercel.app`
3. Обновите `VITE_API_URL` во frontend на URL backend
4. Обновите `API_BASE_URL` в backend на URL backend (для webhooks)

### Проверка деплоя

1. Проверьте API: `https://your-backend.vercel.app/api/prayer-debt/snapshot`
2. Откройте frontend в браузере
3. Проверьте работу всех функций

