from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = Field(default="NLP Translation API", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    log_format: str = Field(default="console", alias="LOG_FORMAT")
    cors_allow_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000",
        alias="CORS_ALLOW_ORIGINS",
    )

    firebase_service_account_path: str | None = Field(
        default=None,
        alias="FIREBASE_SERVICE_ACCOUNT_PATH",
    )
    firebase_service_account_json: str | None = Field(
        default=None,
        alias="FIREBASE_SERVICE_ACCOUNT_JSON",
    )
    firestore_database: str = Field(default="(default)", alias="FIRESTORE_DATABASE")
    groq_api_key: str | None = Field(default=None, alias="GROQ_API_KEY")
    groq_model: str = Field(default="llama-3.1-8b-instant", alias="GROQ_MODEL")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
