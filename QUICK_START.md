# Быстрый старт: GitHub + Vercel

## 1. Добавление в GitHub

### Через командную строку:

```bash
# Инициализация (если еще не инициализирован)
git init
git branch -M main

# Добавление всех файлов
git add .
git commit -m "Initial commit: Complete Prayer Debt Calculator implementation"

# Создайте репозиторий на GitHub.com, затем:
git remote add origin https://github.com/YOUR_USERNAME/prayer-debt-kaza.git
git push -u origin main
```

### Или через GitHub Desktop:
1. Откройте GitHub Desktop
2. File → Add Local Repository
3. Выберите папку проекта
4. Commit & Push

## 2. Деплой на Vercel

### Через веб-интерфейс (рекомендуется):

1. **Backend (API)**:
   - Перейдите на https://vercel.com/new
   - Импортируйте репозиторий из GitHub
   - **Root Directory**: оставьте пустым (корень)
   - **Framework Preset**: Other
   - **Build Command**: оставьте пустым
   - **Output Directory**: оставьте пустым
   - Добавьте переменные окружения (см. ниже)
   - Нажмите Deploy

2. **Frontend (Web)**:
   - Создайте новый проект в Vercel
   - Импортируйте тот же репозиторий
   - **Root Directory**: `web`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - Добавьте переменную `VITE_API_URL` (URL вашего backend)
   - Нажмите Deploy

### Через CLI:

```bash
# Установите Vercel CLI
npm i -g vercel

# Войдите
vercel login

# Деплой backend (в корне проекта)
vercel --prod

# Деплой frontend (в папке web)
cd web
vercel --prod
```

## 3. Переменные окружения

### Backend (в настройках проекта Vercel):

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
EREPLIKA_BASE_URL=https://bot.e-replika.ru
EREPLIKA_API_KEY=your_api_key
API_BASE_URL=https://your-backend.vercel.app
```

### Frontend (в настройках проекта Vercel):

```
VITE_API_URL=https://your-backend.vercel.app/api
```

## 4. После деплоя

1. Обновите `API_BASE_URL` в backend на URL вашего деплоя
2. Обновите `VITE_API_URL` во frontend на URL вашего backend
3. Проверьте работу API: `https://your-backend.vercel.app/api/prayer-debt/snapshot`
4. Откройте frontend в браузере

## 5. Настройка Telegram Mini App

1. Откройте @BotFather в Telegram
2. Выберите вашего бота
3. `/newapp` или `/newappshort`
4. Укажите URL вашего frontend: `https://your-frontend.vercel.app`
5. Готово! Приложение доступно через бота

