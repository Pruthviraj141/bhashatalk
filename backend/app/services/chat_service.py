from starlette.concurrency import run_in_threadpool

from app.schemas.discovery import ChatInitiateResponse
from app.schemas.chat import MessageRead
from app.services.firebase_service import FirebaseService


class ChatService:
    """Chat-related business operations."""

    def __init__(self, firebase_service: FirebaseService) -> None:
        self._firebase = firebase_service

    async def ensure_chat_exists_between_users(self, sender_id: str, receiver_id: str) -> str:
        """
        Returns a stable `chat_id` for a direct chat and creates chat if missing.

        Uses create-if-absent semantics to avoid read-before-write queries.
        """
        return await run_in_threadpool(
            self._firebase.ensure_direct_chat,
            sender_id,
            receiver_id,
        )

    async def assert_users_can_chat(self, sender_id: str, receiver_id: str) -> None:
        is_friend = await run_in_threadpool(self._firebase.are_friends, sender_id, receiver_id)
        if not is_friend:
            raise ValueError("Users must be friends before chatting")

    async def get_user_preferred_language(self, user_id: str) -> str | None:
        return await run_in_threadpool(self._firebase.get_user_preferred_language, user_id)

    async def update_last_message(self, chat_id: str, message: MessageRead) -> None:
        await run_in_threadpool(
            self._firebase.update_chat_last_message,
            chat_id,
            {
                "message_id": message.message_id,
                "sender_id": message.sender_id,
                "original_text": message.original_text,
                "translated_text": message.translated_text,
                "timestamp": message.timestamp,
            },
        )

    async def initiate_chat(self, current_user_id: str, target_user_id: str) -> ChatInitiateResponse:
        await self.assert_users_can_chat(current_user_id, target_user_id)
        chat_id, created = await run_in_threadpool(
            self._firebase.initiate_direct_chat,
            current_user_id,
            target_user_id,
        )
        return ChatInitiateResponse(chat_id=chat_id, created=created)
