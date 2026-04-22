from functools import lru_cache

from app.core.firebase import get_firestore_client
from app.repositories.chat_repository import FirestoreChatRepository
from app.services.auth_service import AuthService
from app.services.chat_service import ChatService
from app.services.firebase_service import FirebaseService
from app.services.message_pipeline_service import MessagePipelineService
from app.services.message_service import MessageService
from app.services.translation_service import GroqTranslationService
from app.services.user_service import UserService
from app.services.websocket_manager import ConnectionManager

_connection_manager = ConnectionManager()


@lru_cache(maxsize=1)
def get_chat_repository() -> FirestoreChatRepository:
    return FirestoreChatRepository(get_firestore_client())


@lru_cache(maxsize=1)
def get_translation_service() -> GroqTranslationService:
    return GroqTranslationService()


@lru_cache(maxsize=1)
def get_firebase_service() -> FirebaseService:
    return FirebaseService(get_firestore_client())


@lru_cache(maxsize=1)
def get_chat_service() -> ChatService:
    return ChatService(get_firebase_service())


@lru_cache(maxsize=1)
def get_message_service() -> MessageService:
    return MessageService(get_firebase_service())


@lru_cache(maxsize=1)
def get_message_pipeline_service() -> MessagePipelineService:
    return MessagePipelineService(
        chat_service=get_chat_service(),
        message_service=get_message_service(),
        translation_service=get_translation_service(),
        connection_manager=get_connection_manager(),
    )


@lru_cache(maxsize=1)
def get_user_service() -> UserService:
    return UserService(get_firebase_service())


@lru_cache(maxsize=1)
def get_auth_service() -> AuthService:
    return AuthService(get_firebase_service())


def get_connection_manager() -> ConnectionManager:
    return _connection_manager
