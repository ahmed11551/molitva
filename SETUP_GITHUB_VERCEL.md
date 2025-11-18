# 🚀 Быстрая настройка: GitHub + Vercel

## Шаг 1: Добавление в GitHub

### Вариант A: Через GitHub Desktop (самый простой)

1. Откройте **GitHub Desktop**
2. **File** → **Add Local Repository**
3. Выберите папку проекта: `C:\Users\Dev-Ops\Desktop\Пропущенные намазы (Каза)`
4. Введите commit message: `Initial commit: Complete Prayer Debt Calculator`
5. Нажмите **Commit to main**
6. Нажмите **Publish repository** (создаст новый репозиторий на GitHub)
7. Выберите имя репозитория (например: `prayer-debt-kaza`)
8. Нажмите **Publish repository**

### Вариант B: Через командную строку

```powershell
# Перейдите в папку проекта
cd "C:\Users\Dev-Ops\Desktop\Пропущенные намазы (Каза)"

# Инициализация Git
git init
git branch -M main

# Добавление файлов
git add .
git commit -m "Initial commit: Complete Prayer Debt Calculator implementation"

# Создайте репозиторий на https://github.com/new, затем:
git remote add origin https://github.com/YOUR_USERNAME/prayer-debt-kaza.git
git push -u origin main
```

## Шаг 2: Деплой на Vercel

### Backend (API)

1. Перейдите на https://vercel.com/new
2. Нажмите **Import Git Repository**
3. Выберите ваш репозиторий `prayer-debt-kaza`
4. Настройки проекта:
   - **Project Name**: `prayer-debt-api` (или любое другое)
   - **Root Directory**: оставьте пустым (`.`)
   - **Framework Preset**: `Other`
   - **Build Command**: оставьте пустым
   - **Output Directory**: оставьте пустым
   - **Install Command**: `npm install`
5. **Environment Variables** → Добавьте:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   EREPLIKA_BASE_URL=https://bot.e-replika.ru
   EREPLIKA_API_KEY=your_api_key
   API_BASE_URL=https://your-backend.vercel.app (обновите после деплоя)
   ```
6. Нажмите **Deploy**
7. Скопируйте URL деплоя (например: `https://prayer-debt-api.vercel.app`)

### Frontend (Web)

1. В Vercel нажмите **Add New Project**
2. Выберите тот же репозиторий `prayer-debt-kaza`
3. Настройки проекта:
   - **Project Name**: `prayer-debt-web` (или любое другое)
   - **Root Directory**: `web`
   - **Framework Preset**: `Vite` (автоматически определится)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. **Environment Variables** → Добавьте:
   ```
   VITE_API_URL=https://your-backend.vercel.app/api
   ```
   (замените `your-backend.vercel.app` на реальный URL вашего backend)
5. Нажмите **Deploy**

## Шаг 3: Обновление переменных окружения

После деплоя backend:

1. Скопируйте URL backend (например: `https://prayer-debt-api.vercel.app`)
2. В настройках **backend проекта** в Vercel:
   - Обновите `API_BASE_URL` на ваш реальный URL
3. В настройках **frontend проекта** в Vercel:
   - Обновите `VITE_API_URL` на `https://your-backend.vercel.app/api`
4. Передеплойте оба проекта (или они обновятся автоматически)

## Шаг 4: Проверка

1. **Backend**: Откройте `https://your-backend.vercel.app/api/prayer-debt/snapshot`
   - Должен вернуть 404 или JSON (это нормально, если нет данных)

2. **Frontend**: Откройте `https://your-frontend.vercel.app`
   - Должен открыться интерфейс приложения

## Шаг 5: Настройка Telegram Mini App

1. Откройте @BotFather в Telegram
2. Выберите вашего бота
3. Отправьте команду: `/newapp` или `/newappshort`
4. Укажите:
   - **Title**: Пропущенные намазы (Каза)
   - **Description**: Расчёт и отслеживание пропущенных намазов
   - **Photo**: (опционально) загрузите иконку
   - **Web App URL**: `https://your-frontend.vercel.app`
5. Готово! Приложение доступно через вашего бота

## Полезные ссылки

- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Repository**: https://github.com/YOUR_USERNAME/prayer-debt-kaza
- **Vercel Docs**: https://vercel.com/docs

## Troubleshooting

### Ошибка при деплое backend
- Убедитесь, что `api/index.ts` существует
- Проверьте, что `@vercel/node` не требуется в dependencies (Vercel установит автоматически)

### Ошибка при деплое frontend
- Убедитесь, что `VITE_API_URL` указан правильно
- Проверьте, что build проходит локально: `cd web && npm run build`

### API не работает
- Проверьте переменные окружения в Vercel
- Убедитесь, что `API_BASE_URL` указывает на правильный URL
- Проверьте логи в Vercel Dashboard

