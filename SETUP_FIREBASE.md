# Firebase Setup Steps

1. Create project in Firebase Console with display name: **NLP Project Database**.
2. Set project ID to: `nlp-project-database` (or your available variant).
3. In Firestore Database, choose **Create database**.
4. Select **Production mode**.
5. Choose your closest region.
6. Deploy local rules/indexes from this workspace:
   - `firebase deploy --only firestore:rules`
   - `firebase deploy --only firestore:indexes`

> Note: Project display name can contain spaces, but project ID cannot.

## FastAPI Backend: Firebase Admin SDK

Backend files created:
- `backend/app/core/config.py`
- `backend/app/core/firebase.py`
- `backend/app/main.py`
- `backend/app/api/health.py`
- `backend/.env.example`
- `backend/requirements.txt`

### 1) Install dependencies

- `fastapi`
- `uvicorn[standard]`
- `firebase-admin`
- `pydantic-settings`
- `python-dotenv`

### 2) Configure credentials securely

1. Place service account key JSON outside source control (for example in a local secrets folder).
2. Copy `backend/.env.example` to `backend/.env`.
3. Set one credential source:
   - `FIREBASE_SERVICE_ACCOUNT_PATH` (recommended), or
   - `FIREBASE_SERVICE_ACCOUNT_JSON` (from secret manager).

### 3) Reusable Firestore client pattern

- `get_firestore_client()` in `backend/app/core/firebase.py` is a singleton (cached via `lru_cache`).
- Firebase app initialization is lock-protected to avoid race conditions.
- Client is lazily initialized, reused across requests, and closed during app shutdown.

### 4) Security and efficiency notes

- Never commit service account keys to the repository.
- Keep `.env` and key files in `.gitignore`.
- Use one shared Firestore client per process for connection reuse.
- Use FastAPI lifespan startup/shutdown hooks for predictable lifecycle management.
