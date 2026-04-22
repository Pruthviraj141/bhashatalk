from datetime import datetime
from typing import Any, Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class AppBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)


class UserProfile(AppBaseModel):
    user_id: str
    username: str
    email: str | None = None
    preferred_language: str
    avatar: str | None = None
    created_at: datetime | None = None


class MessageCreate(AppBaseModel):
    sender_id: str
    receiver_id: str
    original_text: str
    sender_lang: str
    receiver_lang: str


class WSMessagePayload(AppBaseModel):
    chat_id: str
    client_message_id: str | None = None
    sender_id: str
    receiver_id: str
    message: str = Field(min_length=1, max_length=5000)
    sender_lang: str = Field(validation_alias=AliasChoices("sender_lang", "language"))
    receiver_lang: str


class WSTypingPayload(AppBaseModel):
    chat_id: str
    sender_id: str
    receiver_id: str
    is_typing: bool = False


class MessageRead(AppBaseModel):
    message_id: str
    client_message_id: str | None = None
    chat_id: str
    sender_id: str
    receiver_id: str
    original_text: str | None = None
    translated_text: str
    translated_content: dict[str, str] | None = None
    sender_lang: str
    receiver_lang: str
    timestamp: datetime


class MessageStoreInput(AppBaseModel):
    chat_id: str
    client_message_id: str | None = None
    sender_id: str
    receiver_id: str
    original_text: str = Field(min_length=1, max_length=5000)
    translated_text: str
    translated_content: dict[str, str] | None = None
    sender_lang: str
    receiver_lang: str


class ChatSummary(AppBaseModel):
    chat_id: str
    participants: list[str]
    last_message: dict[str, Any] | None = None
    updated_at: datetime


class WSInboundMessage(AppBaseModel):
    type: Literal["message", "typing", "ping"] = "message"
    payload: WSMessagePayload | WSTypingPayload | None = None


class WSOutboundMessage(AppBaseModel):
    event: Literal["message", "typing", "ack", "error", "status_update"]
    data: dict[str, Any] = Field(default_factory=dict)
