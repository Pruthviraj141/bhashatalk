import json
import os
import uuid
from pathlib import Path

import firebase_admin
from dotenv import load_dotenv
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import SERVER_TIMESTAMP


def _load_env() -> None:
    root = Path(__file__).resolve().parent
    load_dotenv(root / ".env")
    load_dotenv(root / "backend" / ".env")


def _build_credential() -> credentials.Base:
    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
    service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")

    if service_account_json:
        return credentials.Certificate(json.loads(service_account_json))

    if service_account_path:
        path = Path(service_account_path).expanduser().resolve()
        if not path.exists():
            raise FileNotFoundError(f"Service account file not found: {path}")
        return credentials.Certificate(str(path))

    # Local fallback for this workspace only (not recommended for production)
    fallback = Path(__file__).resolve().parent / "firebase.json"
    if fallback.exists():
        payload = json.loads(fallback.read_text(encoding="utf-8"))
        if payload.get("type") == "service_account":
            return credentials.Certificate(payload)

    raise RuntimeError(
        "No Firebase credentials found. Set FIREBASE_SERVICE_ACCOUNT_PATH or "
        "FIREBASE_SERVICE_ACCOUNT_JSON in .env"
    )


def _init_firestore() -> firestore.Client:
    if not firebase_admin._apps:
        firebase_admin.initialize_app(_build_credential())
    return firestore.client()


def run_crud_test() -> None:
    db = _init_firestore()

    test_suffix = uuid.uuid4().hex[:8]
    user_id = f"test_user_{test_suffix}"
    chat_id = f"test_chat_{test_suffix}"
    message_id = f"test_msg_{test_suffix}"

    user_ref = db.collection("users").document(user_id)
    chat_ref = db.collection("chats").document(chat_id)
    message_ref = chat_ref.collection("messages").document(message_id)

    print("[1/4] CREATE")
    user_ref.set(
        {
            "user_id": user_id,
            "username": "crud_tester",
            "email": f"{user_id}@example.com",
            "preferred_language": "en",
        }
    )

    chat_ref.set(
        {
            "participants": [user_id, "receiver_demo"],
            "last_message": None,
            "updated_at": SERVER_TIMESTAMP,
        }
    )

    message_ref.set(
        {
            "chat_id": chat_id,
            "sender_id": user_id,
            "receiver_id": "receiver_demo",
            "original_text": "Hello from CRUD test",
            "translated_text": "Hola desde prueba CRUD",
            "sender_lang": "en",
            "receiver_lang": "es",
            "timestamp": SERVER_TIMESTAMP,
        }
    )

    print("[2/4] READ")
    user_snapshot = user_ref.get()
    assert user_snapshot.exists, "User document was not created"

    history = list(chat_ref.collection("messages").order_by("timestamp").limit(10).stream())
    assert any(doc.id == message_id for doc in history), "Message not found in chat history"

    print("[3/4] UPDATE")
    message_ref.update({"translated_text": "Bonjour depuis le test CRUD"})
    chat_ref.update(
        {
            "last_message": {
                "message_id": message_id,
                "sender_id": user_id,
                "original_text": "Hello from CRUD test",
                "translated_text": "Bonjour depuis le test CRUD",
                "timestamp": SERVER_TIMESTAMP,
            },
            "updated_at": SERVER_TIMESTAMP,
        }
    )

    updated_message = message_ref.get().to_dict() or {}
    assert (
        updated_message.get("translated_text") == "Bonjour depuis le test CRUD"
    ), "Message update failed"

    print("[4/4] DELETE")
    message_ref.delete()
    chat_ref.delete()
    user_ref.delete()

    assert not message_ref.get().exists, "Message delete failed"
    assert not chat_ref.get().exists, "Chat delete failed"
    assert not user_ref.get().exists, "User delete failed"

    print("✅ Firebase Firestore CRUD test passed")


if __name__ == "__main__":
    _load_env()
    run_crud_test()
