# Инструкция по загрузке проекта в GitHub

## Проблема с кодировкой пути

Из-за проблем с кодировкой кириллицы в PowerShell, выполните следующие команды вручную:

## Вариант 1: Через Git Bash (рекомендуется)

1. Откройте **Git Bash**
2. Перейдите в директорию проекта:
   ```bash
   cd "/c/Users/Dev-Ops/Desktop/Пропущенные намазы (Каза)"
   ```
3. Выполните команды:
   ```bash
   git init
   git branch -M main
   git add .
   git commit -m "Initial commit: Complete Prayer Debt Calculator implementation"
   git remote add origin https://github.com/ahmed11551/prayer-debt-kaza.git
   git push -u origin main --force
   ```

## Вариант 2: Через GitHub Desktop

1. Откройте **GitHub Desktop**
2. **File** → **Add Local Repository**
3. Выберите папку: `C:\Users\Dev-Ops\Desktop\Пропущенные намазы (Каза)`
4. Введите commit message: `Initial commit: Complete Prayer Debt Calculator implementation`
5. Нажмите **Commit to main**
6. **Repository** → **Repository Settings** → **Remote**
7. Установите **Primary remote repository**: `https://github.com/ahmed11551/prayer-debt-kaza.git`
8. Нажмите **Publish repository**

## Вариант 3: Через командную строку Windows (cmd)

1. Откройте **cmd** (не PowerShell)
2. Перейдите в директорию проекта:
   ```cmd
   cd "C:\Users\Dev-Ops\Desktop\Пропущенные намазы (Каза)"
   ```
3. Выполните команды:
   ```cmd
   git init
   git branch -M main
   git add .
   git commit -m "Initial commit: Complete Prayer Debt Calculator implementation"
   git remote add origin https://github.com/ahmed11551/prayer-debt-kaza.git
   git push -u origin main --force
   ```

## Проверка

После выполнения команд проверьте репозиторий:
- Откройте: https://github.com/ahmed11551/prayer-debt-kaza
- Убедитесь, что все файлы загружены

