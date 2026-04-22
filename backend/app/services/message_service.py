from datetime import UTC, datetime
from uuid import uuid4

from firebase_admin import firestore
from starlette.concurrency import run_in_threadpool

from app.core.firebase import get_firestore_client
from app.schemas.chat import MessageRead, MessageStoreInput
from app.services.firebase_service import FirebaseService


class MessageService:
    """Message-related business operations."""

    def __init__(self, firebase_service: FirebaseService) -> None:
        self._firebase = firebase_service
        self._db = get_firestore_client()

    def _store_message_sync(self, payload: MessageStoreInput) -> MessageRead:
        now = datetime.now(UTC)
        message_id = payload.client_message_id or uuid4().hex

        chat_message_ref = (
            self._db.collection("chats").document(payload.chat_id).collection("messages").document(message_id)
        )
        existing = chat_message_ref.get()
        if existing.exists:
            data = existing.to_dict() or {}
            return MessageRead(
                message_id=message_id,
                client_message_id=data.get("client_message_id"),
                chat_id=data["chat_id"],
                sender_id=data["sender_id"],
                receiver_id=data["receiver_id"],
                original_text=data.get("original_text"),
                translated_text=data["translated_text"],
                translated_content=data.get("translated_content"),
                sender_lang=data["sender_lang"],
                receiver_lang=data["receiver_lang"],
                timestamp=data["timestamp"],
            )

        message_doc = {
            "chat_id": payload.chat_id,
            "client_message_id": payload.client_message_id,
            "sender_id": payload.sender_id,
            "receiver_id": payload.receiver_id,
            "original_text": payload.original_text,
            "translated_text": payload.translated_text,
            "translated_content": payload.translated_content,
            "sender_lang": payload.sender_lang,
            "receiver_lang": payload.receiver_lang,
            "timestamp": now,
        }

        # Top-level messages collection for efficient real-time and history queries by chat_id.
        batch = self._db.batch()
        batch.set(self._db.collection("messages").document(message_id), message_doc)
        batch.set(chat_message_ref, message_doc)
        batch.commit()

        self._firebase.upsert_contact(payload.sender_id, payload.receiver_id, now, create_if_missing=False)
        self._firebase.upsert_contact(payload.receiver_id, payload.sender_id, now, create_if_missing=False)
        return MessageRead(message_id=message_id, **message_doc)

    async def save_message(self, payload: MessageStoreInput) -> MessageRead:
        return await run_in_threadpool(self._store_message_sync, payload)

    def _get_chat_messages_sync(self, chat_id: str, limit: int = 50) -> list[MessageRead]:
        page_size = max(1, min(limit, 200))
        query = (
            self._db.collection("chats")
            .document(chat_id)
            .collection("messages")
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
            .limit(page_size)
        )

        result: list[MessageRead] = []
        for doc in query.stream():
            data = doc.to_dict() or {}
            result.append(
                MessageRead(
                    message_id=doc.id,
                    client_message_id=data.get("client_message_id"),
                    chat_id=data["chat_id"],
                    sender_id=data["sender_id"],
                    receiver_id=data["receiver_id"],
                    original_text=data.get("original_text"),
                    translated_text=data["translated_text"],
                    translated_content=data.get("translated_content"),
                    sender_lang=data["sender_lang"],
                    receiver_lang=data["receiver_lang"],
                    timestamp=data["timestamp"],
                )
            )
        return result

    async def get_chat_messages(self, chat_id: str, limit: int = 50) -> list[MessageRead]:
        return await run_in_threadpool(self._get_chat_messages_sync, chat_id, limit)
