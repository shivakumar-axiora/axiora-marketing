import httpx
import pytest

from app.services.crypto import encrypt
from app.services.resend_client import ResendClient, ResendError


class FakeResponse:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


class FakeSetting:
    def __init__(self, api_key="", from_email="", from_name=""):
        self.resend_api_key_enc = encrypt(api_key) if api_key else ""
        self.from_email = from_email
        self.from_name = from_name


def test_from_setting_missing_key_raises():
    with pytest.raises(ResendError):
        ResendClient.from_setting(FakeSetting(api_key="", from_email="me@axiora.com"))


def test_from_setting_missing_from_email_raises():
    with pytest.raises(ResendError):
        ResendClient.from_setting(FakeSetting(api_key="re_123", from_email=""))


def test_from_setting_none_raises():
    with pytest.raises(ResendError):
        ResendClient.from_setting(None)


def test_from_setting_builds_client():
    client = ResendClient.from_setting(FakeSetting(api_key="re_123", from_email="me@axiora.com", from_name="Axiora"))
    assert client.creds.api_key == "re_123"
    assert client.creds.from_email == "me@axiora.com"


def test_send_email_success(monkeypatch):
    client = ResendClient.from_setting(FakeSetting(api_key="re_123", from_email="me@axiora.com"))

    def fake_post(url, json, headers, timeout):
        assert json["to"] == ["you@example.com"]
        assert json["subject"] == "Hello"
        return FakeResponse(200, {"id": "email_abc123"})

    monkeypatch.setattr(httpx, "post", fake_post)
    resp = client.send_email(to="you@example.com", subject="Hello", html="<p>Hi</p>")
    assert resp["id"] == "email_abc123"


def test_send_email_error_raises_resend_error(monkeypatch):
    client = ResendClient.from_setting(FakeSetting(api_key="re_123", from_email="me@axiora.com"))

    def fake_post(url, json, headers, timeout):
        return FakeResponse(422, {"message": "Invalid `to` field", "name": "validation_error"})

    monkeypatch.setattr(httpx, "post", fake_post)
    with pytest.raises(ResendError) as exc_info:
        client.send_email(to="bad", subject="Hello", html="<p>Hi</p>")
    assert exc_info.value.code == "validation_error"
    assert exc_info.value.status_code == 422


def test_test_connection_success(monkeypatch):
    client = ResendClient.from_setting(FakeSetting(api_key="re_123", from_email="me@axiora.com"))

    def fake_get(url, headers, timeout):
        return FakeResponse(200, {"data": []})

    monkeypatch.setattr(httpx, "get", fake_get)
    result = client.test_connection()
    assert result == {"data": []}
