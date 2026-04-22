# FastAPI Real-Time Chat Backend

## Structure

app/
- api/
  - deps/services.py                # Dependency providers (repo/services/manager)
  - routes/chat.py                  # REST endpoints for chat history and message create
  - routes/websocket.py             # WebSocket endpoint for real-time chat
  - health.py                       # Health check endpoint
- core/
  - config.py                       # Environment-based settings
  - firebase.py                     # Firebase Admin + Firestore singleton client
- repositories/
  - chat_repository.py              # Firestore persistence layer
- schemas/
  - chat.py                         # Pydantic request/response and WS payload models
- services/
  - websocket_manager.py            # In-memory connection manager by chat room
  - translation_service.py          # Translation service placeholder
- main.py                           # FastAPI app wiring and lifespan hooks

## Run

1. Create and fill `backend/.env` from `backend/.env.example`.
2. Install dependencies from `backend/requirements.txt`.
3. Start server from `backend` directory:
   - `uvicorn app.main:app --reload`

Required translation env vars:
- `GROQ_API_KEY`
- `GROQ_MODEL` (default: `llama-3.1-8b-instant`)

> Note: `backend/` does not contain a `package.json`, so `npm install` will fail here. Use `pip install -r requirements.txt` for the backend, and run `npm install` only inside `frontend/`.

## Notes

- Firestore client is initialized once and reused.
- Translation module uses Groq API with in-process LRU caching.
- WebSocket manager is isolated from persistence and translation for clean modularity.
