"""Application configuration loaded from environment variables."""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=True)

    # App
    PROJECT_NAME: str = "Axiora WhatsApp Marketing"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    # Stored as a raw comma-separated string so pydantic-settings does not try to
    # JSON-decode it from the environment. Use `cors_origins` for the parsed list.
    BACKEND_CORS_ORIGINS: str = "http://localhost:5173"

    # Security
    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    CREDENTIALS_ENCRYPTION_KEY: str = ""

    # Database
    DATABASE_URL: str = "sqlite:///./axiora.db"

    # Celery
    USE_CELERY: bool = False
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # Storage
    STORAGE_BACKEND: str = "local"
    MEDIA_ROOT: str = "./media"

    # Email
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "no-reply@axiora.local"
    FRONTEND_URL: str = "http://localhost:5173"

    # WhatsApp
    WHATSAPP_API_BASE: str = "https://graph.facebook.com/v20.0"

    # Resend (email campaigns)
    RESEND_API_BASE: str = "https://api.resend.com"

    # Sending engine
    SEND_BATCH_SIZE: int = 25
    SEND_RATE_PER_SECOND: int = 10
    MAX_SEND_RETRIES: int = 3

    @property
    def cors_origins(self) -> List[str]:
        """Parse the comma-separated BACKEND_CORS_ORIGINS into a list of origins."""
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
