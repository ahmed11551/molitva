# Настройка GitHub репозитория

## Шаги для добавления в GitHub

### 1. Инициализация Git (если еще не инициализирован)

```bash
git init
git branch -M main
```

### 2. Добавление файлов

```bash
git add .
git commit -m "Initial commit: Prayer Debt Calculator - Complete implementation"
```

### 3. Создание репозитория на GitHub

1. Перейдите на https://github.com/new
2. Название репозитория: `prayer-debt-kaza` (или другое на ваше усмотрение)
3. Выберите "Private" или "Public"
4. НЕ создавайте README, .gitignore или лицензию (они уже есть)
5. Нажмите "Create repository"

### 4. Подключение к GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/prayer-debt-kaza.git
git push -u origin main
```

Если репозиторий уже существует:
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/prayer-debt-kaza.git
git push -u origin main
```

### 5. Проверка

Откройте репозиторий на GitHub и убедитесь, что все файлы загружены.

## Структура репозитория

```
prayer-debt-kaza/
├── src/              # Backend (Express API)
├── web/              # Frontend (React + Vite)
├── supabase/         # Миграции базы данных
├── docs/             # Документация
├── api/              # Vercel serverless functions
├── .gitignore
├── vercel.json       # Конфигурация Vercel для backend
├── web/vercel.json   # Конфигурация Vercel для frontend
├── package.json      # Backend dependencies
├── web/package.json  # Frontend dependencies
└── README.md
```

