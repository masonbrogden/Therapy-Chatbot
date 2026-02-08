# Therapy-Chatbot-LLM-AWS

## Developer Notes

### Environment Variables

Backend (`.env.example`):
- `DATABASE_URL` - Postgres connection string in production (SQLite allowed only for local dev).
- `SUPABASE_JWT_SECRET` - Supabase JWT secret (Project Settings → API).
- `SUPABASE_JWT_ISSUER` - Optional issuer (e.g., `https://<project-ref>.supabase.co/auth/v1`).
- `SUPABASE_JWT_AUDIENCE` - Optional audience (often `authenticated`).
- `OPENAI_API_KEY`, `PINECONE_API_KEY` - Optional LLM/RAG providers.
- `AUTH_BYPASS` - Set `true` only in local dev (blocked in production).

Frontend (`frontend/.env.example`):
- `VITE_API_URL` - Backend API base URL.
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`

### Database Setup
- Local dev uses SQLite by default. If you change models, delete `instance/therapy_chatbot.db`
  and restart the Flask app to recreate tables.
- Production requires Postgres via `DATABASE_URL`.

### Auth Sanity Checks (manual)
- Valid Supabase JWT → should return `200` on protected endpoints.
- Missing/invalid token → should return `401 {"error": "Unauthorized"}`.
- `AUTH_BYPASS=true` allowed only in dev; app refuses to start in production.

### Key Endpoints
- Authenticated user profile: `GET/PUT /api/user/profile`
- Chat sessions: `POST /api/chat/session`, `GET /api/chat/sessions`
- Mood entries: `POST /api/mood`, `GET /api/mood`
- Therapy plans: `POST /api/plan/generate`, `GET /api/plan`, `PUT /api/plan/complete`
- Exercises: `GET /api/exercises`, `POST /api/exercises/complete`
- Journal: `POST/GET /api/journal/entries`, `GET/PUT/DELETE /api/journal/entries/:id`
- Crisis resources: `GET /api/crisis-resources`

### Journal Feature
- Requires authentication; entries are scoped to the current user.
- Uses SQLite by default. If the journal table is missing, delete `instance/therapy_chatbot.db`
  and restart the backend to recreate tables.
- The optional Journal Lock re-checks your password for email/password accounts.

### Safety Layer
- All chat messages pass through a safety filter.
- High-risk content triggers crisis-safe responses and surfaces help resources.

## Production on VM (Oracle Linux/Ubuntu)
1. Install dependencies:
   ```bash
   sudo apt-get update
   sudo apt-get install -y python3-venv python3-pip
   python3 -m venv venv
   . venv/bin/activate
   pip install -r requirements.txt
   ```
2. Set environment variables:
   - `ENV=production`
   - `DATABASE_URL=postgresql://...`
   - `SUPABASE_JWT_SECRET=...`
   - Optional: `SUPABASE_JWT_ISSUER`, `SUPABASE_JWT_AUDIENCE`, `RAG_ENABLED`, `OPENAI_API_KEY`, `PINECONE_API_KEY`
3. Run with Gunicorn:
   ```bash
   gunicorn -c gunicorn.conf.py wsgi:app
   ```
4. Reverse proxy:
   - Use Nginx/Caddy to proxy HTTPS -> `127.0.0.1:8000`
   - Limit allowed origins via `FRONTEND_ORIGINS` (comma-separated)
5. systemd (high level):
   - Create a service that runs `gunicorn -c gunicorn.conf.py wsgi:app`
   - Ensure `Environment=` lines for required env vars
   - Use `journalctl -u <service>` for logs
