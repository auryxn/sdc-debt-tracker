# Julius Debt Tracker (v1.0 Alpha) 🦾

Fullstack приложение для отслеживания долгов (кому должны вы, кто должен вам).

## Архитектура
*   **Backend:** FastAPI (Python) + SQLite
*   **Frontend:** React (TypeScript) + Axios

## Быстрый запуск

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm start
```
Приложение будет доступно по адресу `http://localhost:3000`.

## Возможности
- Учет входящих и исходящих долгов.
- Мгновенный расчет баланса.
- Возможность закрывать (settle) долги.
