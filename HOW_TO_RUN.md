# Therapy Chatbot – Local Run Instructions

## Prerequisites

- **Python 3.9+**
- **Node.js 16+** (for frontend)
- **Git**

## Backend Setup

### 1. Install Python Dependencies

```bash
cd c:\Therapy-Chatbot
pip install -r requirements.txt
```

### 2. Create Instance Directory (for SQLite database)

```bash
mkdir -p instance
```

### 3. Run the Backend

```bash
python app.py
```

Expected output:
```
✓ RAG chain initialized with Pinecone (optional, may not appear if keys missing)
 * Running on http://127.0.0.1:9090
```

The backend will:
- Auto-create SQLite database at `instance/therapy_chatbot.db`
- Create all required tables on first run
- Listen on `http://127.0.0.1:9090`

**Note:** If Pinecone/OpenAI keys are missing, the RAG chain won't initialize but the app will still work with fallback responses.

---

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd c:\Therapy-Chatbot\frontend
```

### 2. Install Node Dependencies

```bash
npm install
```

### 3. Create Environment File

```bash
copy .env.example .env.local
```

(Or manually create `.env.local` with):
```
VITE_API_URL=http://127.0.0.1:9090/api
```

### 4. Run the Development Server

```bash
npm run dev
```

Expected output:
```
VITE v5.0.0  ready in 123 ms

➜  Local:   http://localhost:5173/
```

---

## Accessing the Application

Once both backend and frontend are running:

1. **Frontend:** Open http://localhost:5173 in your browser
2. **Backend API:** http://127.0.0.1:9090/api
3. **Health Check:** http://127.0.0.1:9090/api/health

---

## Testing the API Endpoints

### Health Check
```bash
curl http://127.0.0.1:9090/api/health
```

### Create a Chat Session
```bash
curl -X POST http://127.0.0.1:9090/api/chat/session \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test_session_123"}'
```

### Send a Chat Message
```bash
curl -X POST http://127.0.0.1:9090/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test_session_123",
    "chat_session_id": 1,
    "role": "user",
    "content": "I feel anxious",
    "language": "en"
  }'
```

### Get Crisis Resources
```bash
curl "http://127.0.0.1:9090/api/crisis-resources?country=US"
```

### Check Safety
```bash
curl -X POST http://127.0.0.1:9090/api/safety/check \
  -H "Content-Type: application/json" \
  -d '{"text": "I am feeling stressed today"}'
```

### Get Exercises
```bash
curl http://127.0.0.1:9090/api/exercises
```

### Get Mood Entries
```bash
curl "http://127.0.0.1:9090/api/mood?session_id=test_session_123&range=7d"
```

### Create Mood Entry
```bash
curl -X POST http://127.0.0.1:9090/api/mood \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test_session_123",
    "mood_score": 7,
    "tags": ["happy", "calm"],
    "note": "Great day today!"
  }'
```

---

## Feature Testing Checklist

- [ ] **Chat**: Send messages, view history, create/delete sessions
- [ ] **Mood Tracker**: Log mood, view 7/30d/all trends, see stats
- [ ] **Therapy Plan**: Create profile, generate plan, regenerate
- [ ] **Exercises**: View exercises, step through guided flow
- [ ] **Crisis Support**: Select country, copy phone numbers, open links
- [ ] **Contact Form**: Submit with validation, rate limiting (5/hour)
- [ ] **Privacy**: Export data (JSON), delete all data with confirmation
- [ ] **Safety Filter**: Test crisis keywords (app should show crisis banner)
- [ ] **Language Selector**: Switch language in navbar, persists in localStorage
- [ ] **Floating Crisis Button**: Bottom-right button accessible on all pages

---

## Database

SQLite database location: `c:\Therapy-Chatbot\instance\therapy_chatbot.db`

To inspect the database:
```bash
python
>>> from app import db
>>> db.session.execute("SELECT * FROM chat_sessions LIMIT 1;").fetchall()
```

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'flask_sqlalchemy'"
```bash
pip install flask-sqlalchemy flask-cors
```

### "Port 9090 already in use"
```bash
# Find and kill process on port 9090 (Windows)
netstat -ano | findstr :9090
taskkill /PID <PID> /F
```

### Frontend won't connect to backend
- Ensure backend is running on http://127.0.0.1:9090
- Check `VITE_API_URL` in `frontend/.env.local`
- Browser console should show CORS errors if misconfigured

### Database error on startup
```bash
rm instance/therapy_chatbot.db
python app.py  # Will auto-create fresh database
```

---

## Building for Production

### Frontend
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

### Backend
Use a production WSGI server (e.g., Gunicorn):
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:9090 app:app
```

---

## Key Features Summary

✅ **No Authentication** – Anonymous session_id in localStorage
✅ **Offline-Ready** – Fallback responses if LLM unavailable
✅ **Full Data Control** – Export/delete endpoints for privacy
✅ **Crisis Detection** – Safety filter with supportive responses
✅ **Guided Exercises** – 5 step-by-step exercises built-in
✅ **Mood Tracking** – 7/30/all day trends with charts
✅ **Therapy Plans** – Deterministic generator (works offline)
✅ **Multi-language** – Language selector persists preference
✅ **Responsive Design** – Mobile-friendly UI
✅ **Clean Architecture** – Separated frontend/backend with clear API

---

## Recommended Development Workflow

**Terminal 1 (Backend)**
```bash
cd c:\Therapy-Chatbot
python app.py
```

**Terminal 2 (Frontend)**
```bash
cd c:\Therapy-Chatbot\frontend
npm run dev
```

**Terminal 3 (Testing API)**
```bash
# Run curl commands as needed
curl http://127.0.0.1:9090/api/health
```

---

## Next Steps

1. **Customize** crisis resources by country in `services/crisis_resources.py`
2. **Add** your LLM keys (.env) for enhanced chat responses
3. **Deploy** using cloud platform (Vercel for frontend, Render/Heroku for backend)
4. **Extend** with more exercises or therapy approaches

---

**Questions or Issues?** Check the contact page or create an issue on GitHub.
