import json
import threading
from functools import lru_cache
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore

from app.core.config import get_settings

_init_lock = threading.Lock()
_firebase_app: firebase_admin.App | None = None


class FirebaseInitializationError(RuntimeError):
    """Raised when Firebase cannot be initialized from configured credentials."""


def _build_credential() -> credentials.Base:
    settings = get_settings()

    if settings.firebase_service_account_json:
        try:
            payload = json.loads(settings.firebase_service_account_json)
        except json.JSONDecodeError as exc:
            raise FirebaseInitializationError(
                "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON."
            ) from exc
        return credentials.Certificate(payload)

    if settings.firebase_service_account_path:
        path = Path(settings.firebase_service_account_path).expanduser().resolve()
        if not path.exists():
            raise FirebaseInitializationError(
                f"Service account file not found: {path}"
            )
        return credentials.Certificate(str(path))

    raise FirebaseInitializationError(
        "No Firebase credentials configured. Set FIREBASE_SERVICE_ACCOUNT_PATH "
        "or FIREBASE_SERVICE_ACCOUNT_JSON."
    )


def get_firebase_app() -> firebase_admin.App:
    global _firebase_app

    if _firebase_app is not None:
        return _firebase_app

    with _init_lock:
        if _firebase_app is None:
            cred = _build_credential()
            _firebase_app = firebase_admin.initialize_app(cred)

    return _firebase_app


@lru_cache(maxsize=1)
def get_firestore_client() -> firestore.Client:
    """
    Reusable singleton Firestore client.

    Uses lazy initialization and caching so the app keeps a single gRPC channel
    pool for efficient request throughput.
    """
    settings = get_settings()
    app = get_firebase_app()
    return firestore.client(app=app, database_id=settings.firestore_database)


def shutdown_firebase() -> None:
    """
    Gracefully close Firestore transport and delete the Firebase app.
    """
    global _firebase_app

    client = get_firestore_client()
    close = getattr(client, "close", None)
    if callable(close):
        close()

    get_firestore_client.cache_clear()

    if _firebase_app is not None:
        firebase_admin.delete_app(_firebase_app)
        _firebase_app = None
