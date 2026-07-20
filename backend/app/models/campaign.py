"""Campaign and per-recipient message models."""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, PKMixin, TimestampMixin
from app.models.enums import CampaignStatus, Channel, MessageStatus, ScheduleType


class Campaign(Base, PKMixin, TimestampMixin):
    __tablename__ = "campaigns"

    name: Mapped[str] = mapped_column(String(200), index=True)
    description: Mapped[Optional[str]] = mapped_column(String(500), default="")
    channel: Mapped[Channel] = mapped_column(default=Channel.WHATSAPP, index=True)
    subject: Mapped[Optional[str]] = mapped_column(String(255), default="")  # email only
    message_body: Mapped[Optional[str]] = mapped_column(Text, default="")
    status: Mapped[CampaignStatus] = mapped_column(default=CampaignStatus.DRAFT, index=True)

    schedule_type: Mapped[ScheduleType] = mapped_column(default=ScheduleType.IMMEDIATE)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    timezone: Mapped[str] = mapped_column(String(64), default="UTC")

    template_id: Mapped[Optional[int]] = mapped_column(ForeignKey("templates.id"))
    media_id: Mapped[Optional[int]] = mapped_column(ForeignKey("media.id"))
    template_variables: Mapped[Optional[str]] = mapped_column(Text, default="")  # JSON string

    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    # Aggregate counters (kept in sync by the sending engine).
    total_recipients: Mapped[int] = mapped_column(Integer, default=0)
    sent_count: Mapped[int] = mapped_column(Integer, default=0)
    delivered_count: Mapped[int] = mapped_column(Integer, default=0)
    read_count: Mapped[int] = mapped_column(Integer, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, default=0)

    template: Mapped[Optional["Template"]] = relationship()
    media: Mapped[Optional["Media"]] = relationship()
    recipients: Mapped[List["CampaignRecipient"]] = relationship(
        back_populates="campaign", cascade="all, delete-orphan"
    )
    logs: Mapped[List["CampaignLog"]] = relationship(
        back_populates="campaign", cascade="all, delete-orphan"
    )


class CampaignRecipient(Base, PKMixin, TimestampMixin):
    __tablename__ = "campaign_recipients"

    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), index=True)
    contact_id: Mapped[int] = mapped_column(ForeignKey("contacts.id"))

    phone: Mapped[Optional[str]] = mapped_column(String(30))
    email: Mapped[Optional[str]] = mapped_column(String(255), default="")
    rendered_subject: Mapped[Optional[str]] = mapped_column(String(255), default="")  # email only
    rendered_message: Mapped[Optional[str]] = mapped_column(Text, default="")
    status: Mapped[MessageStatus] = mapped_column(default=MessageStatus.PENDING, index=True)
    provider_message_id: Mapped[Optional[str]] = mapped_column(String(128), index=True)
    error_code: Mapped[Optional[str]] = mapped_column(String(64), default="")
    error_message: Mapped[Optional[str]] = mapped_column(String(500), default="")
    retries: Mapped[int] = mapped_column(Integer, default=0)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    campaign: Mapped["Campaign"] = relationship(back_populates="recipients")
    contact: Mapped["Contact"] = relationship()


class CampaignLog(Base, PKMixin, TimestampMixin):
    __tablename__ = "campaign_logs"

    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), index=True)
    level: Mapped[str] = mapped_column(String(20), default="info")
    event: Mapped[str] = mapped_column(String(100))
    message: Mapped[Optional[str]] = mapped_column(Text, default="")

    campaign: Mapped["Campaign"] = relationship(back_populates="logs")
