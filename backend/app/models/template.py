"""WhatsApp message templates."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, PKMixin, TimestampMixin
from app.models.enums import Channel, TemplateCategory, TemplateStatus


class Template(Base, PKMixin, TimestampMixin):
    __tablename__ = "templates"

    name: Mapped[str] = mapped_column(String(200), index=True)
    channel: Mapped[Channel] = mapped_column(default=Channel.WHATSAPP, index=True)
    language: Mapped[str] = mapped_column(String(20), default="en_US")
    category: Mapped[TemplateCategory] = mapped_column(default=TemplateCategory.MARKETING)
    status: Mapped[TemplateStatus] = mapped_column(default=TemplateStatus.DRAFT)
    subject: Mapped[Optional[str]] = mapped_column(String(255), default="")  # email only
    html_body: Mapped[Optional[str]] = mapped_column(Text, default="")  # email only
    body: Mapped[str] = mapped_column(Text, default="")
    header: Mapped[Optional[str]] = mapped_column(String(255), default="")
    header_type: Mapped[Optional[str]] = mapped_column(String(20), default="")  # "" | TEXT | IMAGE | VIDEO | DOCUMENT
    footer: Mapped[Optional[str]] = mapped_column(String(255), default="")
    example_variables: Mapped[Optional[str]] = mapped_column(Text, default="")  # JSON
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    wa_template_id: Mapped[Optional[str]] = mapped_column(String(128), default="")

    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
