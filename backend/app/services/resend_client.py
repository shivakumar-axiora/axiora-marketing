"""Official Resend API client for email campaign sending.

Only the official Resend REST API is used, called directly via httpx
(consistent with services/whatsapp.py) rather than an SDK dependency.
Docs: https://resend.com/docs/api-reference/emails/send-email
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

import httpx

from app.core.config import settings
from app.services.crypto import decrypt

logger = logging.getLogger("axiora.resend")


@dataclass
class ResendCredentials:
    api_key: str
    from_email: str
    from_name: str = ""


class ResendError(Exception):
    def __init__(self, message: str, code: str = "", status_code: int = 0):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


class ResendClient:
    """Thin wrapper around Resend's transactional/campaign email endpoints."""

    def __init__(self, creds: ResendCredentials, base_url: str | None = None):
        self.creds = creds
        self.base_url = (base_url or settings.RESEND_API_BASE).rstrip("/")

    @classmethod
    def from_setting(cls, setting) -> "ResendClient":
        """Build a client from an EmailSetting model, decrypting the API key."""
        key = decrypt(setting.resend_api_key_enc) if setting else None
        if not setting or not key or not setting.from_email:
            raise ResendError("Resend is not configured. Add your API key and From Email in Settings → Email.")
        return cls(
            ResendCredentials(
                api_key=key,
                from_email=setting.from_email,
                from_name=setting.from_name or "",
            )
        )

    @property
    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.creds.api_key}",
            "Content-Type": "application/json",
        }

    @property
    def _from_header(self) -> str:
        if self.creds.from_name:
            return f"{self.creds.from_name} <{self.creds.from_email}>"
        return self.creds.from_email

    # ------------------------------------------------------------------ send
    def send_email(self, to: str, subject: str, html: str) -> dict[str, Any]:
        payload = {
            "from": self._from_header,
            "to": [to],
            "subject": subject or "(no subject)",
            "html": html or "",
        }
        return self._post(f"{self.base_url}/emails", payload)

    # ------------------------------------------------------------- account
    def test_connection(self) -> dict[str, Any]:
        """Cheapest authenticated call to verify the API key works."""
        return self._get(f"{self.base_url}/domains")

    # ------------------------------------------------------------- internal
    def _post(self, url: str, payload: dict) -> dict[str, Any]:
        try:
            resp = httpx.post(url, json=payload, headers=self._headers, timeout=30.0)
        except httpx.HTTPError as exc:  # pragma: no cover - network
            raise ResendError(f"Network error: {exc}") from exc
        return self._handle(resp)

    def _get(self, url: str) -> dict[str, Any]:
        try:
            resp = httpx.get(url, headers=self._headers, timeout=30.0)
        except httpx.HTTPError as exc:  # pragma: no cover - network
            raise ResendError(f"Network error: {exc}") from exc
        return self._handle(resp)

    @staticmethod
    def _handle(resp: httpx.Response) -> dict[str, Any]:
        try:
            data = resp.json()
        except ValueError:
            data = {}
        if resp.status_code >= 400:
            raise ResendError(
                message=(data or {}).get("message", f"HTTP {resp.status_code}"),
                code=(data or {}).get("name", str(resp.status_code)),
                status_code=resp.status_code,
            )
        return data
