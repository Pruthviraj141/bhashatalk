from pydantic import ValidationError
import logging
from datetime import UTC, datetime
from uuid import uuid4

from app.schemas.chat import MessageStoreInput, WSInboundMessage, WSOutboundMessage
from app.services.chat_service import ChatService
from app.services.message_service import MessageService
from app.services.translation_service import TranslationService
from app.services.websocket_manager import ConnectionManager

logger = logging.getLogger(__name__)


class MessagePipelineError(RuntimeError):
    """Base pipeline error."""


class MessageValidationError(MessagePipelineError):
    """Invalid inbound websocket payload."""


class MessageAuthorizationError(MessagePipelineError):
    """Sender is not authorized for this websocket session."""


class MessagePipelineService:
    """
    Asynchronous pipeline for WebSocket message processing.

    Steps:
    1. Validate inbound JSON payload
    2. Ensure chat exists
    3. Translate message (placeholder)
    4. Save message to Firestore
    5. Broadcast to active chat connections
    """

    def __init__(
        self,
        chat_service: ChatService,
        message_service: MessageService,
        translation_service: TranslationService,
        connection_manager: ConnectionManager,
    ) -> None:
        self._chat_service = chat_service
        self._message_service = message_service
        self._translation_service = translation_service
        self._connection_manager = connection_manager

    _SUPPORTED_LANGUAGES = ("en", "hi", "mr")

    @staticmethod
    def _normalize_lang(lang: str | None, fallback: str = "en") -> str:
        value = (lang or "").strip().lower().replace("_", "-")
        if not value:
            return fallback
        return value.split("-", 1)[0]

    async def _build_translated_content(
        self,
        text: str,
        source_lang: str,
    ) -> dict[str, str]:
        translated_content = await self._translation_service.translate_multi(
            text=text,
            source_lang=source_lang,
        )

        normalized: dict[str, str] = {}
        for lang in self._SUPPORTED_LANGUAGES:
            value = (translated_content.get(lang) or "").strip()
            normalized[lang] = value or text
        normalized[source_lang] = text
        return normalized

    async def _send_status_update(
        self,
        user_id: str,
        chat_id: str,
        message_id: str,
        client_message_id: str | None,
        status: str,
    ) -> None:
        await self._connection_manager.send_personal_message(
            user_id,
            WSOutboundMessage(
                event="status_update",
                data={
                    "type": "status_update",
                    "chat_id": chat_id,
                    "message_id": message_id,
                    "client_message_id": client_message_id,
                    "status": status,
                    "delivery_status": status,
                    "status_at": datetime.now(UTC).isoformat(),
                },
            ).model_dump(),
        )

    @staticmethod
    def _message_payload_for_client(
        *,
        message_id: str,
        client_message_id: str | None,
        chat_id: str,
        sender_id: str,
        receiver_id: str,
        original_text: str,
        sender_lang: str,
        timestamp_iso: str,
        translated_text: str,
        translated_content: dict[str, str],
        receiver_lang: str,
        delivery_status: str,
    ) -> dict:
        return {
            "type": "message",
            "id": message_id,
            "message_id": message_id,
            "client_message_id": client_message_id,
            "chat_id": chat_id,
            "content": original_text,
            "language": sender_lang,
            "translated_text": translated_text,
            "translated_content": translated_content,
            "original_text": original_text,
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "sender_lang": sender_lang,
            "receiver_lang": receiver_lang,
            "timestamp": timestamp_iso,
            "delivery_status": delivery_status,
        }

    async def process_incoming(self, current_user_id: str, raw_packet: dict) -> None:
        try:
            packet = WSInboundMessage.model_validate(raw_packet)
        except ValidationError as exc:
            raise MessageValidationError(str(exc)) from exc

        if packet.type == "ping":
            await self._connection_manager.send_personal_message(
                current_user_id,
                WSOutboundMessage(event="ack", data={"message": "pong"}).model_dump(),
            )
            return

        if packet.type == "typing":
            if packet.payload is None:
                raise MessageValidationError("payload is required")

            payload = packet.payload
            if not hasattr(payload, "sender_id") or not hasattr(payload, "receiver_id"):
                raise MessageValidationError("invalid typing payload")

            if payload.sender_id != current_user_id:
                raise MessageAuthorizationError("sender_id mismatch")

            await self._connection_manager.send_personal_message(
                payload.receiver_id,
                WSOutboundMessage(
                    event="typing",
                    data={
                        "chat_id": payload.chat_id,
                        "sender_id": payload.sender_id,
                        "receiver_id": payload.receiver_id,
                        "is_typing": bool(payload.is_typing),
                    },
                ).model_dump(),
            )
            return

        if packet.payload is None:
            raise MessageValidationError("payload is required")

        payload = packet.payload
        logger.info(
            "[ws] received message sender_id=%s receiver_id=%s chat_id=%s",
            payload.sender_id,
            payload.receiver_id,
            payload.chat_id,
        )

        if payload.sender_id != current_user_id:
            raise MessageAuthorizationError("sender_id mismatch")

        try:
            await self._chat_service.assert_users_can_chat(
                sender_id=payload.sender_id,
                receiver_id=payload.receiver_id,
            )
        except ValueError as exc:
            raise MessageAuthorizationError(str(exc)) from exc

        expected_chat_id = await self._chat_service.ensure_chat_exists_between_users(
            sender_id=payload.sender_id,
            receiver_id=payload.receiver_id,
        )

        if payload.chat_id != expected_chat_id:
            raise MessageValidationError("chat_id mismatch for sender/receiver pair")

        sender_lang = self._normalize_lang(getattr(payload, "sender_lang", None), fallback="en")
        receiver_lang = self._normalize_lang(
            (await self._chat_service.get_user_preferred_language(payload.receiver_id)) or payload.receiver_lang,
            fallback="en",
        )

        original_text = payload.message
        translated_content = await self._build_translated_content(
            text=original_text,
            source_lang=sender_lang,
        )

        translated_text_for_receiver = translated_content.get(receiver_lang, original_text) or original_text
        translated_text_for_sender = translated_content.get(sender_lang, original_text) or original_text

        message_id = payload.client_message_id or uuid4().hex
        timestamp_iso = datetime.now(UTC).isoformat()

        receiver_payload = self._message_payload_for_client(
            message_id=message_id,
            client_message_id=message_id,
            chat_id=expected_chat_id,
            sender_id=payload.sender_id,
            receiver_id=payload.receiver_id,
            original_text=original_text,
            sender_lang=sender_lang,
            timestamp_iso=timestamp_iso,
            translated_text=translated_text_for_receiver,
            translated_content=translated_content,
            receiver_lang=receiver_lang,
            delivery_status="delivered",
        )
        sender_payload = self._message_payload_for_client(
            message_id=message_id,
            client_message_id=message_id,
            chat_id=expected_chat_id,
            sender_id=payload.sender_id,
            receiver_id=payload.receiver_id,
            original_text=original_text,
            sender_lang=sender_lang,
            timestamp_iso=timestamp_iso,
            translated_text=translated_text_for_sender,
            translated_content=translated_content,
            receiver_lang=sender_lang,
            delivery_status="sent",
        )

        await self._connection_manager.join_chat(chat_id=expected_chat_id, user_id=payload.sender_id)
        await self._connection_manager.join_chat(chat_id=expected_chat_id, user_id=payload.receiver_id)

        receiver_online = await self._connection_manager.is_connected(payload.receiver_id)
        if receiver_online:
            await self._connection_manager.send_personal_message(
                payload.receiver_id,
                WSOutboundMessage(event="message", data=receiver_payload).model_dump(),
            )

        await self._connection_manager.send_personal_message(
            payload.sender_id,
            WSOutboundMessage(event="message", data=sender_payload).model_dump(),
        )
        await self._send_status_update(
            user_id=payload.sender_id,
            chat_id=expected_chat_id,
            message_id=message_id,
            client_message_id=message_id,
            status="sent",
        )
        if receiver_online:
            await self._send_status_update(
                user_id=payload.sender_id,
                chat_id=expected_chat_id,
                message_id=message_id,
                client_message_id=message_id,
                status="delivered",
            )

        message_input = MessageStoreInput(
            chat_id=expected_chat_id,
            client_message_id=message_id,
            sender_id=payload.sender_id,
            receiver_id=payload.receiver_id,
            original_text=original_text,
            translated_text=translated_text_for_receiver,
            translated_content=translated_content,
            sender_lang=sender_lang,
            receiver_lang=receiver_lang,
        )

        try:
            message = await self._message_service.save_message(message_input)
            await self._chat_service.update_last_message(chat_id=expected_chat_id, message=message)
        except Exception:
            logger.exception("[ws] failed to persist message chat_id=%s", expected_chat_id)
            await self._send_status_update(
                user_id=payload.sender_id,
                chat_id=expected_chat_id,
                message_id=message_id,
                client_message_id=message_id,
                status="failed",
            )
