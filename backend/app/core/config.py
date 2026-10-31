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
    # Set true on serverless hosts (Vercel) so SQLAlchemy opens a fresh connection
    # per invocation instead of holding a process-local pool between cold starts.
    DATABASE_SERVERLESS: bool = False

    # Celery
    USE_CELERY: bool = False
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # Storage
    STORAGE_BACKEND: str = "local"             # local | s3
    MEDIA_ROOT: str = "./media"
    # Public URL this backend is reachable at (e.g. an ngrok tunnel in dev, or your
    # production domain). Required for locally-stored media links to work with
    # WhatsApp template headers — Meta fetches them over the public internet, so a
    # bare "localhost" or relative path is not fetchable. Not needed with STORAGE_BACKEND=s3.
    PUBLIC_BASE_URL: str = ""

    # S3-compatible storage (AWS S3, Cloudflare R2, Supabase Storage, MinIO, ...)
    S3_BUCKET: str = ""
    S3_REGION: str = "us-east-1"
    S3_ACCESS_KEY_ID: str = ""
    S3_SECRET_ACCESS_KEY: str = ""
    # Leave empty for AWS S3. Set for R2/MinIO/Supabase, e.g. https://<acct>.r2.cloudflarestorage.com
    S3_ENDPOINT_URL: str = ""
    # Public base URL used to build media links. Defaults to the bucket's own
    # endpoint if empty; set this to a CDN/custom domain fronting the bucket.
    S3_PUBLIC_URL_BASE: str = ""
    # R2/MinIO need path-style URLs (endpoint/bucket/key); AWS S3 uses virtual-hosted style.
    S3_USE_PATH_STYLE: bool = False

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
