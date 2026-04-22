from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AppBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)


class UserUpsertRequest(AppBaseModel):
    user_id: str
    username: str = Field(min_length=3, max_length=40)
    preferred_language: str = Field(min_length=2, max_length=10)
    avatar: str | None = None


class UserView(AppBaseModel):
    user_id: str
    username: str
    preferred_language: str
    avatar: str | None = None
    created_at: datetime | None = None
    relation_status: str | None = None
    request_id: str | None = None


class UserSearchResponse(AppBaseModel):
    results: list[UserView]


class ContactView(AppBaseModel):
    user_id: str
    contact_id: str
    username: str
    preferred_language: str
    avatar: str | None = None
    last_interaction: datetime
    interaction_count: int = 0


class ContactListResponse(AppBaseModel):
    contacts: list[ContactView]


class ChatInitiateRequest(AppBaseModel):
    current_user_id: str
    target_user_id: str


class ChatInitiateResponse(AppBaseModel):
    chat_id: str
    created: bool


class FriendRequestCreateRequest(AppBaseModel):
    sender_id: str
    receiver_id: str


class FriendRequestActionRequest(AppBaseModel):
    actor_id: str


class FriendRequestView(AppBaseModel):
    request_id: str
    sender_id: str
    receiver_id: str
    status: str
    created_at: datetime
    sender_username: str | None = None
    sender_avatar: str | None = None
    sender_preferred_language: str | None = None


class FriendRequestListResponse(AppBaseModel):
    requests: list[FriendRequestView]
