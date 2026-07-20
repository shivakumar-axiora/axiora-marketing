"""Contact, Group and their many-to-many association."""
from __future__ import annotations

from typing import List, Optional

from sqlalchemy import Column, ForeignKey, String, Table, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, PKMixin, TimestampMixin
from app.models.enums import ContactStatus

group_contacts = Table(
    "group_contacts",
    Base.metadata,
    Column("group_id", ForeignKey("groups.id", ondelete="CASCADE"), primary_key=True),
    Column("contact_id", ForeignKey("contacts.id", ondelete="CASCADE"), primary_key=True),
)


class Group(Base, PKMixin, TimestampMixin):
    __tablename__ = "groups"

    name: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), default="")
    color: Mapped[str] = mapped_column(String(20), default="#25D366")
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    contacts: Mapped[List["Contact"]] = relationship(
        secondary=group_contacts, back_populates="groups"
    )

    __table_args__ = (UniqueConstraint("name", "owner_id", name="uq_group_name_owner"),)


class Contact(Base, PKMixin, TimestampMixin):
    __tablename__ = "contacts"

    name: Mapped[str] = mapped_column(String(150), index=True)
    phone: Mapped[str] = mapped_column(String(30), index=True)      # E.164 without +
    country_code: Mapped[str] = mapped_column(String(8), default="")
    email: Mapped[Optional[str]] = mapped_column(String(255), default="")
    company: Mapped[Optional[str]] = mapped_column(String(150), default="")
    city: Mapped[Optional[str]] = mapped_column(String(100), default="")
    state: Mapped[Optional[str]] = mapped_column(String(100), default="")
    tags: Mapped[Optional[str]] = mapped_column(String(500), default="")   # comma separated
    notes: Mapped[Optional[str]] = mapped_column(Text, default="")
    status: Mapped[ContactStatus] = mapped_column(default=ContactStatus.ACTIVE)

    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    groups: Mapped[List["Group"]] = relationship(
        secondary=group_contacts, back_populates="contacts"
    )

    __table_args__ = (
        UniqueConstraint("phone", "owner_id", name="uq_contact_phone_owner"),
    )


class Segment(Base, PKMixin, TimestampMixin):
    """Saved, named filter criteria — resolved dynamically against live contacts."""

    __tablename__ = "segments"

    name: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), default="")
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    filters: Mapped[str] = mapped_column(Text, default="{}")  # JSON-encoded filter dict

    __table_args__ = (UniqueConstraint("name", "owner_id", name="uq_segment_name_owner"),)
