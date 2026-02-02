# Therapy-Chatbot-LLM-AWS

## Developer Notes

### Environment Variables

Backend (`.env.example`):
- `DATABASE_URL` - SQLAlchemy database URL.
- `FIREBASE_ADMIN_JSON` - Firebase Admin service account JSON string.
- `OPENAI_API_KEY`, `PINECONE_API_KEY` - Optional LLM/RAG providers.

Frontend (`frontend/.env.example`):
- `VITE_API_URL` - Backend API base URL.
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`

### Database Setup
- This project uses SQLite by default. If you change models, delete `instance/therapy_chatbot.db`
  and restart the Flask app to recreate tables.
- Or run `python scripts/reset_db.py` to back up and recreate the local DB.

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
