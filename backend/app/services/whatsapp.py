"""Official WhatsApp Business Platform (Meta Cloud API) client.

Only the official Graph API is used. No browser automation or unofficial endpoints.
Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Optional

import httpx

from app.core.config import settings
from app.services.crypto import decrypt

logger = logging.getLogger("axiora.whatsapp")


@dataclass
class WhatsAppCredentials:
    phone_number_id: str
    access_token: str
    business_account_id: str = ""


class WhatsAppError(Exception):
    def __init__(self, message: str, code: str = "", status_code: int = 0):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


class WhatsAppClient:
    """Thin wrapper around the Cloud API messaging endpoints."""

    def __init__(self, creds: WhatsAppCredentials, base_url: str | None = None):
        self.creds = creds
        self.base_url = (base_url or settings.WHATSAPP_API_BASE).rstrip("/")

    @classmethod
    def from_setting(cls, setting) -> "WhatsAppClient":
        """Build a client from a Setting model, decrypting the token."""
        token = decrypt(setting.access_token_enc) if setting else None
        if not setting or not setting.phone_number_id or not token:
            raise WhatsAppError("WhatsApp API is not configured. Add credentials in Settings → API.")
        return cls(
            WhatsAppCredentials(
                phone_number_id=setting.phone_number_id,
                access_token=token,
                business_account_id=setting.business_account_id or "",
            )
        )

    @property
    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.creds.access_token}",
            "Content-Type": "application/json",
        }

    def _messages_url(self) -> str:
        return f"{self.base_url}/{self.creds.phone_number_id}/messages"

    # ------------------------------------------------------------------ send
    def send_text(self, to: str, body: str, preview_url: bool = True) -> dict[str, Any]:
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "text",
            "text": {"preview_url": preview_url, "body": body},
        }
        return self._post(self._messages_url(), payload)

    def send_template(
        self,
        to: str,
        template_name: str,
        language: str = "en_US",
        components: Optional[list] = None,
    ) -> dict[str, Any]:
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": language},
                "components": components or [],
            },
        }
        return self._post(self._messages_url(), payload)

    def send_media(self, to: str, media_type: str, link: str, caption: str = "") -> dict[str, Any]:
        media_obj: dict[str, Any] = {"link": link}
        if caption and media_type in ("image", "video", "document"):
            media_obj["caption"] = caption
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": media_type,
            media_type: media_obj,
        }
        return self._post(self._messages_url(), payload)

    # ------------------------------------------------------------- account
    def list_templates(self) -> list[dict[str, Any]]:
        if not self.creds.business_account_id:
            raise WhatsAppError("Business Account ID is required to sync templates.")
        url = f"{self.base_url}/{self.creds.business_account_id}/message_templates?limit=200"
        data = self._get(url)
        return data.get("data", [])

    def test_connection(self) -> dict[str, Any]:
        """Fetch phone number metadata to verify credentials."""
        url = f"{self.base_url}/{self.creds.phone_number_id}"
        return self._get(url)

    # ------------------------------------------------------------- internal
    def _post(self, url: str, payload: dict) -> dict[str, Any]:
        try:
            resp = httpx.post(url, json=payload, headers=self._headers, timeout=30.0)
        except httpx.HTTPError as exc:  # pragma: no cover - network
            raise WhatsAppError(f"Network error: {exc}") from exc
        return self._handle(resp)

    def _get(self, url: str) -> dict[str, Any]:
        try:
            resp = httpx.get(url, headers=self._headers, timeout=30.0)
        except httpx.HTTPError as exc:  # pragma: no cover - network
            raise WhatsAppError(f"Network error: {exc}") from exc
        return self._handle(resp)

    @staticmethod
    def _handle(resp: httpx.Response) -> dict[str, Any]:
        try:
            data = resp.json()
        except ValueError:
            data = {}
        if resp.status_code >= 400:
            err = (data or {}).get("error", {})
            raise WhatsAppError(
                message=err.get("message", f"HTTP {resp.status_code}"),
                code=str(err.get("code", resp.status_code)),
                status_code=resp.status_code,
            )
        return data
