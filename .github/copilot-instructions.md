# Therapy Chatbot – AI Coding Instructions

## Architecture Overview

**Stack:** Flask (Python) backend + React/Vite frontend. SQLite database with SQLAlchemy ORM.

**Data Flow:**
1. Frontend (`frontend/src`) sends requests to Flask backend (`/api/*` routes) on port `9090`
2. Routes (`routes/`) handle endpoints, interact with SQLAlchemy models (`models.py`)
3. Services layer (`services/`) provides business logic: safety filtering, plan generation, exercise data
4. Database (`instance/therapy_chatbot.db`) stores: chat sessions, mood entries, therapy profiles, plans

**Key Design Pattern:** Session-based isolation via `session_id` (browser localStorage UUID). Each user's data is scoped to their session_id across all endpoints. **Critical:** Always filter queries by `session_id` to prevent data leakage.

## Critical Workflows

### Setup & Running
```bash
# Backend
pip install -r requirements.txt
python app.py  # Runs on http://127.0.0.1:9090

# Frontend  
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173 (Vite dev server)
```
- Backend auto-creates SQLite database at `instance/therapy_chatbot.db` on first run
- CORS configured for localhost:3000, localhost:5173, 127.0.0.1:5173 (see [app.py](app.py#L34))
- Optional Pinecone RAG chain: initializes if `PINECONE_API_KEY` and `OPENAI_API_KEY` present; gracefully degrades if unavailable

### Testing
- No formal test suite; manual testing via API calls and frontend UI
- Safety check endpoint: `POST /api/safety/check` to validate crisis/self-harm detection
- Session isolation: verify queries filter by `session_id` parameter

## Code Patterns & Conventions

### Backend Routes Pattern
All endpoints require `session_id` validation and data filtering:
```python
@chat_bp.route('/endpoint', methods=['GET'])
def handler():
    session_id = request.args.get('session_id')
    if not session_id:
        return jsonify({'error': 'session_id required'}), 400
    # Always filter queries by session_id
    data = Model.query.filter_by(session_id=session_id).all()
    return jsonify([d.to_dict() for d in data]), 200
```
**Golden rule:** Every database query must include `.filter_by(session_id=session_id)` to prevent cross-user data access.
See [routes/chat.py#L29-L32](routes/chat.py#L29), [routes/mood.py](routes/mood.py).

### Database Models
All models inherit from `db.Model` (SQLAlchemy). Core tables with `session_id` indexing:
- `ChatSession` (id, session_id, title, created_at) + relationship to `ChatMessage`
- `ChatMessage` (id, chat_session_id, role, content, created_at)
- `MoodEntry` (id, session_id, mood_score 1-10, tags_json, note, created_at)
- `TherapyProfile` (id, session_id UNIQUE, main_concern, approach CBT/DBT/etc, goals, minutes_per_day)
- `TherapyPlan` (id, session_id, plan_json TEXT, created_at)

**Important:** Models with direct `session_id` column use `index=True` or `unique=True`. See [models.py#L5-15](models.py#L5) for MoodEntry pattern.
All models implement `to_dict()` for JSON serialization.

### Safety Filtering
Critical: All user messages go through `services/safety_filter.py` before generating responses. Returns `{risk_level: 'high'|'medium'|'low', reasons: [...]}`:
- `'high'` (self-harm keywords) → call `get_crisis_response()`, set `crisis_mode: true`
- `'medium'` (crisis keywords) → call `get_medium_support_response()` 
- `'low'` → proceed to LLM/fallback response
- See [routes/chat.py#L80-L105](routes/chat.py#L80) for response selection logic
- Keywords defined in [services/safety_filter.py#L5-L13](services/safety_filter.py#L5)

### Frontend API Client
Centralized in `frontend/src/services/api.js`: Axios client with base URL from `VITE_API_URL` env var.
All API calls use this client (not direct fetch). See [api.js](frontend/src/services/api.js).

### Frontend Session Management
`frontend/src/utils/session.js` stores user's `session_id` in localStorage as UUID. Passed to backend with every request.

## Integration Points & External Dependencies

- **Pinecone** (optional): Vector DB for RAG retrieval. If unavailable, app falls back to hardcoded responses
- **OpenAI** (optional): Chat completion model (`gpt-4o`) used if Pinecone initialized
- **HuggingFace**: Embeddings downloaded via `src/helper.py` for vector search
- **Flask-SQLAlchemy**: ORM for SQLite; auto-creates tables
- **Axios**: Frontend HTTP client for API calls
- **React Router**: Frontend navigation (see [App.jsx](frontend/src/App.jsx))

## Project-Specific Conventions

1. **Error Responses:** Always use `jsonify({'error': 'message'})` with appropriate HTTP status (400 for bad request, 404 for not found)
2. **Data Validation:** Check for required fields before database operations: `if not all([session_id, chat_session_id, content]):`
3. **Language Support:** Frontend passes `language` param to chat endpoint; routes accept it (see [chat.py#L64](routes/chat.py#L64))
4. **Hardcoded Data:** Exercises, crisis resources, plan templates stored in `services/` – NOT API-fetched. See [services/exercises_data.py](services/exercises_data.py), [services/plan_generator.py#L6-42](services/plan_generator.py#L6)
5. **Rate Limiting:** `routes/contact.py` implements rate limiting on contact form submissions
6. **JSON in Database:** Use `json.loads()` / `json.dumps()` for TEXT columns storing objects (e.g., `tags_json` in MoodEntry, `plan_json` in TherapyPlan)

## Common Dev Tasks

- **Add new endpoint:** Create route in `routes/`, register blueprint in [app.py#L73-80](app.py#L73). Use `session_id` validation pattern above.
- **Add database table:** Create model in [models.py](models.py), include `session_id` column with `index=True`. `db.create_all()` runs auto on app startup.
- **Update safety logic:** Modify `services/safety_filter.py` keyword lists ([line 5-13](services/safety_filter.py#L5)) and risk_level return values.
- **Chat response logic:** If crisis detected, use `get_crisis_response()`, else use LLM via `rag_chain.invoke()` or fallback string (see [routes/chat.py#L90-L105](routes/chat.py#L90)).
- **Fix CORS issues:** Check [app.py#L35](app.py#L35) allowed origins match your frontend URL (localhost:3000, localhost:5173, 127.0.0.1:5173).
- **Frontend API errors:** Verify `VITE_API_URL` env var points to `http://127.0.0.1:9090/api` (see [api.js#L3](frontend/src/services/api.js#L3))
