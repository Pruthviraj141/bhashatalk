from datetime import UTC, datetime
from uuid import uuid4

from firebase_admin import firestore

from app.schemas.chat import MessageCreate, MessageRead


class FirestoreChatRepository:
    def __init__(self, db: firestore.Client) -> None:
        self._db = db

    def list_messages(self, chat_id: str, limit: int = 50) -> list[MessageRead]:
        query = (
            self._db.collection("chats")
            .document(chat_id)
            .collection("messages")
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
            .limit(limit)
        )

        docs = query.stream()
        messages: list[MessageRead] = []
        for doc in docs:
            data = doc.to_dict() or {}
            messages.append(
                MessageRead(
                    message_id=doc.id,
                    chat_id=data["chat_id"],
                    sender_id=data["sender_id"],
                    receiver_id=data["receiver_id"],
                    original_text=data["original_text"],
                    translated_text=data["translated_text"],
                    sender_lang=data["sender_lang"],
                    receiver_lang=data["receiver_lang"],
                    timestamp=data["timestamp"],
                )
            )
        return messages

    def create_message(self, chat_id: str, payload: MessageCreate, translated_text: str) -> MessageRead:
        now = datetime.now(UTC)
        message_id = uuid4().hex

        message_doc = {
            "chat_id": chat_id,
            "sender_id": payload.sender_id,
            "receiver_id": payload.receiver_id,
            "original_text": payload.original_text,
            "translated_text": translated_text,
            "sender_lang": payload.sender_lang,
            "receiver_lang": payload.receiver_lang,
            "timestamp": now,
        }

        message_ref = (
            self._db.collection("chats")
            .document(chat_id)
            .collection("messages")
            .document(message_id)
        )
        message_ref.set(message_doc)

        chat_ref = self._db.collection("chats").document(chat_id)
        chat_ref.set(
            {
                "participants": firestore.ArrayUnion([payload.sender_id, payload.receiver_id]),
                "last_message": {
                    "message_id": message_id,
                    "sender_id": payload.sender_id,
                    "original_text": payload.original_text,
                    "translated_text": translated_text,
                    "timestamp": now,
                },
                "updated_at": now,
            },
            merge=True,
        )

        return MessageRead(message_id=message_id, **message_doc)
