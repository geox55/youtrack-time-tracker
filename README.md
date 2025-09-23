# Toggl ↔ YouTrack Integration

Интеграция для автоматического трекинга времени между Toggl и YouTrack.

## Установка и запуск

1. Установите зависимости:
```bash
npm install
```

2. Запустите dev сервер:
```bash
npm run dev
```

3. Откройте http://localhost:3000

## Настройка

1. **Toggl API Token**: Получите в профиле Toggl (Settings → API Token)
2. **Toggl Workspace ID**: Найдите в URL при работе с Toggl
3. **YouTrack URL**: URL вашего YouTrack сервера
4. **YouTrack Token**: Permanent Token из профиля YouTrack

## Функции

- Загрузка задач из YouTrack
- Запуск/остановка трекинга времени в Toggl
- Автоматическое создание work items в YouTrack при остановке трекинга
- Отображение статуса трекинга в реальном времени
- История отслеженных задач

## Сборка для продакшена

```bash
npm run build
```

Собранные файлы будут в папке `dist/`.
