from pydantic import BaseModel, ConfigDict, Field

from app.schemas.discovery import UserView


class AppBaseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)


class RegisterRequest(AppBaseModel):
    username: str = Field(min_length=3, max_length=40)
    password: str = Field(min_length=6, max_length=128)
    preferred_language: str = Field(min_length=2, max_length=10)
    avatar: str | None = None


class LoginRequest(AppBaseModel):
    username: str = Field(min_length=3, max_length=40)
    password: str = Field(min_length=6, max_length=128)


class AuthResponse(AppBaseModel):
    user: UserView
