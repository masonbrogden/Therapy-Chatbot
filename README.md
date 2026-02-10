# Therapy Chatbot

Therapy Chatbot is a full-stack mental wellness app with guided chat, mood tracking, journaling, exercises, and safety-aware crisis support flows. The backend is a Flask API and the frontend is a React + Vite SPA.

## Demo
No public deployment link is currently documented in this repository.

## Key Features
- Authenticated chat sessions with history, rename, export, and deletion (`routes/chat.py`)
- Safety checks and crisis-oriented responses/resources (`routes/safety.py`, `routes/crisis.py`, `services/safety_filter.py`)
- Mood tracking with summaries, streaks, and trend calculation (`routes/mood.py`)
- Therapy profile + weekly plan generation/completion tracking (`routes/plan.py`, `services/plan_generator.py`)
- Guided exercise library and progress tracking (`routes/exercises.py`, `services/exercises_data.py`)
- Journal entry CRUD (`routes/journal.py`)
- User profile updates plus anonymous-to-auth session attachment (`routes/user.py`)
- Export and full deletion of user/session data (`routes/data.py`)

## Tech Stack
- Frontend: React 18, React Router, Vite, Axios, Recharts, Framer Motion (`frontend/package.json`)
- Backend: Flask, Flask-CORS, Flask-SQLAlchemy (`requirements.txt`, `app.py`)
- Database: SQLite by default, PostgreSQL via `DATABASE_URL` (`app.py`, `db.py`)
- Auth: Supabase JWT verification on backend + Supabase JS client on frontend (`services/auth.py`, `frontend/src/lib/supabaseClient.js`)
- Optional AI/RAG integrations: OpenAI + Pinecone (`app.py`, `routes/chat.py`)
- Production server: Gunicorn (`gunicorn.conf.py`, `wsgi.py`)

## Architecture Overview
```text
[React + Vite Frontend]
        |
        | HTTP (Bearer token from Supabase session)
        v
[Flask API: /api/* blueprints]
        |
        +--> [Safety/Crisis services]
        +--> [Plan/Exercise services]
        +--> [Optional LLM + RAG (OpenAI/Pinecone)]
        |
        v
[SQLAlchemy Models]
        |
        v
[SQLite (dev) or PostgreSQL (DATABASE_URL)]
```

## Getting Started

### Backend (Flask)
```bash
python -m venv venv
# Windows PowerShell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python app.py
```

- Backend URL: `http://127.0.0.1:8000` (see `app.py`)

### Frontend (Vite)
```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

- Frontend URL: `http://localhost:5173` (see `frontend/vite.config.js`)
- Frontend API base resolution order (see `frontend/src/services/api.js`):
  1. `VITE_API_BASE_URL`
  2. `VITE_API_URL`
  3. default `http://127.0.0.1:8000/api`

## Environment Variables

### Backend (`.env.example`)
```env
DATABASE_URL=sqlite:///instance/therapy_chatbot.db
SUPABASE_JWT_SECRET=
SUPABASE_JWT_ISSUER=
SUPABASE_JWT_AUDIENCE=
OPENAI_API_KEY=
PINECONE_API_KEY=
RAG_ENABLED=false
AUTH_BYPASS=false
ENV=development
FLASK_ENV=development
FRONTEND_ORIGINS=
PREWARM_ON_START=false
WEB_CONCURRENCY=2
GUNICORN_THREADS=4
GUNICORN_TIMEOUT=180
GUNICORN_GRACEFUL_TIMEOUT=30
```

- `DATABASE_URL`: Database connection string.
- `SUPABASE_JWT_SECRET`: Secret used to verify JWT bearer tokens.
- `SUPABASE_JWT_ISSUER`: Optional JWT issuer validation.
- `SUPABASE_JWT_AUDIENCE`: Optional JWT audience validation.
- `OPENAI_API_KEY`: Enables direct LLM chat.
- `PINECONE_API_KEY`: Required when `RAG_ENABLED=true`.
- `RAG_ENABLED`: Enables retrieval-augmented flow.
- `AUTH_BYPASS`: Local auth bypass switch (blocked in production).
- `ENV` / `FLASK_ENV`: Runtime environment mode.
- `FRONTEND_ORIGINS`: Comma-separated CORS allowlist.
- `PREWARM_ON_START`: Optional embedding prewarm at startup.
- `WEB_CONCURRENCY`, `GUNICORN_THREADS`, `GUNICORN_TIMEOUT`, `GUNICORN_GRACEFUL_TIMEOUT`: Gunicorn process/thread/time settings.

### Frontend (`frontend/.env.example`)
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_API_URL=http://127.0.0.1:8000/api
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_AUTH_BYPASS=false
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

- `VITE_API_BASE_URL`: Preferred API host/base.
- `VITE_API_URL`: Alternate API base override.
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`: Supabase client config.
- `VITE_AUTH_BYPASS`: Legacy Firebase helper bypass toggle.
- `VITE_FIREBASE_*`: Legacy Firebase config keys used by `frontend/src/firebase.js`.

### Authentication Note
Supabase is the active auth flow in frontend runtime (`frontend/src/context/AuthContext.jsx`, `frontend/src/lib/supabaseClient.js`, `frontend/src/services/api.js`). A legacy Firebase helper file exists (`frontend/src/firebase.js`), but it is not imported elsewhere in `frontend/src`.

## API Overview
Blueprints are organized in `routes/`. For the full contract, inspect those files directly.

- Core chat: `routes/chat.py`, `routes/chat_profile.py`
- Wellness tracking: `routes/mood.py`, `routes/journal.py`, `routes/plan.py`, `routes/exercises.py`
- Safety and crisis: `routes/safety.py`, `routes/crisis.py`
- Account/data/support: `routes/user.py`, `routes/contact.py`, `routes/data.py`

Key endpoints (sample, verified):
- `GET /api/health`
- `POST /api/chat/message`
- `GET /api/mood/summary`
- `POST /api/plan/generate`
- `GET /api/exercises`
- `POST /api/journal/entries`
- `GET /api/crisis-resources`

## Safety & Disclaimer
This project is for supportive and educational wellness use, not clinical diagnosis or treatment. If you or someone else is in immediate danger, call emergency services immediately. In the United States, call or text `988`.

## Contributing
See `CONTRIBUTING.md`.

## License
Apache License 2.0 (`LICENSE`).