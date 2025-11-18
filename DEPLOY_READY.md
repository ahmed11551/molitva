# ✅ Проект готов к деплою на Vercel

Все файлы настроены и готовы к работе. Следуйте инструкциям ниже.

## 🚀 Быстрый деплой

### 1. Backend (API)

1. Откройте https://vercel.com/new
2. Импортируйте репозиторий: `ahmed11551/prayer-debt-kaza`
3. Настройки:
   - **Project Name**: `prayer-debt-api`
   - **Root Directory**: `.` (оставьте пустым)
   - **Framework Preset**: `Other`
   - **Build Command**: оставьте пустым (Vercel использует TypeScript напрямую)
   - **Output Directory**: оставьте пустым
4. **Environment Variables** (добавьте все):
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   EREPLIKA_BASE_URL=https://bot.e-replika.ru
   EREPLIKA_API_KEY=your_api_key
   API_BASE_URL=https://prayer-debt-api.vercel.app
   PORT=4000
   CALC_VERSION=1.0.0
   MADHAB=hanafi
   NODE_ENV=production
   ```
5. Нажмите **Deploy**
6. Скопируйте URL (например: `https://prayer-debt-api-xyz.vercel.app`)

### 2. Frontend (Web)

1. В Vercel нажмите **Add New Project**
2. Импортируйте тот же репозиторий: `ahmed11551/prayer-debt-kaza`
3. Настройки:
   - **Project Name**: `prayer-debt-web`
   - **Root Directory**: `web` ⚠️ **ВАЖНО!**
   - **Framework Preset**: `Vite` (определится автоматически)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   ```
   VITE_API_URL=https://prayer-debt-api-xyz.vercel.app/api
   ```
   (замените на реальный URL вашего backend + `/api`)
5. Нажмите **Deploy**

## ✅ Что было исправлено

### Backend:
- ✅ `api/index.ts` - улучшена инициализация Supabase с обработкой ошибок
- ✅ `vercel.json` - правильная конфигурация для serverless функций
- ✅ `.vercelignore` - оптимизирован для исключения ненужных файлов
- ✅ `package.json` - добавлены build скрипты

### Frontend:
- ✅ `web/vercel.json` - правильная конфигурация для Vite
- ✅ `web/package.json` - все зависимости на месте

### Общее:
- ✅ Все файлы в GitHub
- ✅ TypeScript конфигурация правильная
- ✅ Все импорты корректны

## 🔍 Проверка после деплоя

### Backend должен вернуть:

Откройте: `https://your-backend.vercel.app/`

```json
{
  "message": "Prayer Debt Calculator API",
  "version": "1.0.0",
  "endpoints": {
    "prayerDebt": "/api/prayer-debt",
    "webhooks": "/api/webhooks",
    "duas": "/api/duas",
    "ai": "/api/ai",
    "goals": "/api/goals",
    "glossary": "/api/glossary",
    "prayerCalendar": "/api/prayer-calendar",
    "friends": "/api/friends"
  }
}
```

### Frontend должен показать:

- Интерфейс "Пропущенные намазы (Каза)"
- Зелёный дизайн
- Вкладки навигации

## 📝 Важные замечания

1. **Root Directory для frontend**: обязательно `web`, не корень!
2. **VITE_API_URL**: должен заканчиваться на `/api`
3. **API_BASE_URL**: обновите после деплоя backend на реальный URL
4. **Переменные окружения**: добавьте для всех окружений (Production, Preview, Development)

## 🐛 Если что-то не работает

1. Проверьте логи деплоя в Vercel Dashboard
2. Убедитесь, что все Environment Variables добавлены
3. Проверьте, что Root Directory для frontend = `web`
4. Убедитесь, что последний коммит в GitHub содержит все изменения

## 📚 Дополнительные инструкции

- Подробная инструкция: `VERCEL_SETUP_STEP_BY_STEP.md`
- Чеклист: `VERCEL_CHECKLIST.md`
- Общая инструкция: `DEPLOY.md`

---

**Всё готово! Проект полностью настроен для деплоя на Vercel.** 🎉

