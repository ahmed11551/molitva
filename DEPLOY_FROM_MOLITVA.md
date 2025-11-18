# 🚀 Деплой из репозитория molitva

## ✅ Репозиторий готов

Все файлы загружены в: **https://github.com/ahmed11551/molitva.git**

## 📋 Быстрый деплой на Vercel

### 1. Настройте доступ Vercel к репозиторию

1. Откройте https://github.com/settings/installations
2. Найдите **Vercel** в списке
3. Нажмите **Configure**
4. Добавьте репозиторий `ahmed11551/molitva` в список доступных
5. Сохраните

### 2. Деплой Backend

1. Откройте https://vercel.com/new
2. Импортируйте репозиторий: `ahmed11551/molitva`
3. Настройки:
   - **Project Name**: `molitva-api` (или `prayer-debt-api`)
   - **Root Directory**: `.` (корень, оставьте пустым)
   - **Framework Preset**: `Other` ⚠️
   - **Build Command**: оставьте пустым
   - **Output Directory**: оставьте пустым
4. **Environment Variables**:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   EREPLIKA_BASE_URL=https://bot.e-replika.ru
   EREPLIKA_API_KEY=your_api_key
   API_BASE_URL=https://molitva-api.vercel.app
   PORT=4000
   CALC_VERSION=1.0.0
   MADHAB=hanafi
   NODE_ENV=production
   ```
5. Нажмите **Deploy**
6. Скопируйте URL (например: `https://molitva-api-xyz.vercel.app`)

### 3. Обновите API_BASE_URL

1. После деплоя скопируйте реальный URL backend
2. В Vercel Dashboard → проект → **Settings** → **Environment Variables**
3. Обновите `API_BASE_URL` на реальный URL
4. **Deployments** → **Redeploy**

### 4. Деплой Frontend

1. В Vercel нажмите **Add New Project**
2. Импортируйте тот же репозиторий: `ahmed11551/molitva`
3. Настройки:
   - **Project Name**: `molitva-web` (или `prayer-debt-web`)
   - **Root Directory**: `web` ⚠️ **ВАЖНО!**
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   ```
   VITE_API_URL=https://molitva-api-xyz.vercel.app/api
   ```
   (замените на реальный URL backend + `/api`)
5. Нажмите **Deploy**
6. Скопируйте URL (например: `https://molitva-web-abc.vercel.app`)

### 5. Создание Telegram бота

1. Откройте @BotFather в Telegram
2. `/newbot` → следуйте инструкциям
3. `/newapp` → выберите бота
4. **Web App URL**: `https://molitva-web-abc.vercel.app` (ваш frontend URL)
5. Готово!

## ✅ Проверка

- **Backend**: `https://your-backend.vercel.app/` → должен вернуть JSON
- **Frontend**: `https://your-frontend.vercel.app/` → должен открыться интерфейс
- **Telegram**: откройте бота → "Open App" → должно работать

## 📚 Подробные инструкции

- `NEW_REPO_DEPLOY.md` - полная инструкция
- `FINAL_DEPLOYMENT_CHECKLIST.md` - чеклист
- `DEPLOY_READY.md` - быстрый старт

---

**Всё готово к деплою!** 🎉

