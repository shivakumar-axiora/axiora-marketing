"""Symmetric encryption for sensitive API credentials (Fernet)."""
import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings


def _fernet() -> Fernet:
    key = settings.CREDENTIALS_ENCRYPTION_KEY
    if not key:
        # Derive a deterministic key from SECRET_KEY as a dev fallback.
        digest = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
        key = base64.urlsafe_b64encode(digest).decode()
    try:
        return Fernet(key.encode() if isinstance(key, str) else key)
    except (ValueError, TypeError):
        digest = hashlib.sha256(key.encode()).digest()
        return Fernet(base64.urlsafe_b64encode(digest))


def encrypt(value: str | None) -> str | None:
    if value in (None, ""):
        return value
    return _fernet().encrypt(value.encode()).decode()


def decrypt(token: str | None) -> str | None:
    if token in (None, ""):
        return token
    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken:
        return None


def mask(value: str | None) -> str | None:
    """Return a masked preview, e.g. ``••••••cdef``."""
    if not value:
        return value
    if len(value) <= 4:
        return "•" * len(value)
    return "•" * 6 + value[-4:]
