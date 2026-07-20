"""Settings, notifications, activity logs, webhook logs."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, PKMixin, TimestampMixin


class Setting(Base, PKMixin, TimestampMixin):
    """Per-user WhatsApp Cloud API configuration (credentials encrypted at rest)."""

    __tablename__ = "settings"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)

    business_account_id: Mapped[Optional[str]] = mapped_column(String(255), default="")
    phone_number_id: Mapped[Optional[str]] = mapped_column(String(255), default="")
    access_token_enc: Mapped[Optional[str]] = mapped_column(Text, default="")
    app_secret_enc: Mapped[Optional[str]] = mapped_column(Text, default="")
    webhook_verify_token: Mapped[Optional[str]] = mapped_column(String(255), default="")
    is_connected: Mapped[bool] = mapped_column(Boolean, default=False)

    # Sending preferences
    send_rate_per_second: Mapped[int] = mapped_column(default=10)
    batch_size: Mapped[int] = mapped_column(default=25)
    default_timezone: Mapped[str] = mapped_column(String(64), default="UTC")

    user: Mapped["User"] = relationship(back_populates="settings")


class EmailSetting(Base, PKMixin, TimestampMixin):
    """Per-user Resend API configuration (credentials encrypted at rest)."""

    __tablename__ = "email_settings"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)

    resend_api_key_enc: Mapped[Optional[str]] = mapped_column(Text, default="")
    from_email: Mapped[Optional[str]] = mapped_column(String(255), default="")
    from_name: Mapped[Optional[str]] = mapped_column(String(255), default="")
    is_connected: Mapped[bool] = mapped_column(Boolean, default=False)

    # Sending preferences
    send_rate_per_second: Mapped[int] = mapped_column(default=2)
    batch_size: Mapped[int] = mapped_column(default=25)

    user: Mapped["User"] = relationship()


class Notification(Base, PKMixin, TimestampMixin):
    __tablename__ = "notifications"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[Optional[str]] = mapped_column(String(500), default="")
    type: Mapped[str] = mapped_column(String(40), default="info")  # info|success|warning|error
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    link: Mapped[Optional[str]] = mapped_column(String(255), default="")


class ActivityLog(Base, PKMixin, TimestampMixin):
    __tablename__ = "activity_logs"

    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(100), index=True)
    entity: Mapped[Optional[str]] = mapped_column(String(80), default="")
    entity_id: Mapped[Optional[str]] = mapped_column(String(80), default="")
    detail: Mapped[Optional[str]] = mapped_column(Text, default="")
    ip_address: Mapped[Optional[str]] = mapped_column(String(64), default="")


class WebhookLog(Base, PKMixin, TimestampMixin):
    __tablename__ = "webhook_logs"

    event_type: Mapped[str] = mapped_column(String(80), default="", index=True)
    payload: Mapped[str] = mapped_column(Text, default="")
    processed: Mapped[bool] = mapped_column(Boolean, default=False)
