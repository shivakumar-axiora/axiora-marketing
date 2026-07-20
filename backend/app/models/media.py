"""Media library assets."""
from __future__ import annotations

from typing import Optional

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, PKMixin, TimestampMixin
from app.models.enums import MediaType


class Media(Base, PKMixin, TimestampMixin):
    __tablename__ = "media"

    filename: Mapped[str] = mapped_column(String(255))
    original_name: Mapped[str] = mapped_column(String(255))
    folder: Mapped[str] = mapped_column(String(120), default="General", index=True)
    media_type: Mapped[MediaType] = mapped_column(default=MediaType.IMAGE)
    mime_type: Mapped[str] = mapped_column(String(120), default="")
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    url: Mapped[str] = mapped_column(String(500))
    wa_media_id: Mapped[Optional[str]] = mapped_column(String(128), default="")

    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
