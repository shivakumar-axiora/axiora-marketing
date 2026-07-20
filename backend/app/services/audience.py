"""Shared contact-filtering and campaign-audience resolution.

Single source of truth for turning a filter dict (as stored on a Segment, or
passed ad-hoc to GET /contacts) into a SQLAlchemy predicate, and for turning
a campaign's audience selection (groups / segments / individual contacts /
"all contacts") into the concrete list of Contact rows to message.
"""
from __future__ import annotations

import json
from typing import Any, Optional

from sqlalchemy import Select, or_, select
from sqlalchemy.orm import Session

from app.models.contact import Contact, Group, Segment
from app.models.enums import ContactStatus
from app.models.user import User

# Contacts in these statuses are never messaged, regardless of how they were
# selected (opted out / blocked) — enforced centrally so no audience source
# can accidentally bypass it.
EXCLUDED_STATUSES = (ContactStatus.UNSUBSCRIBED, ContactStatus.BLOCKED)


def apply_contact_filters(stmt: Select, filters: dict[str, Any]) -> Select:
    """Apply a Segment-style filter dict to a Contact select statement.

    Shared by GET /contacts (ad-hoc filters) and segment resolution (stored
    filters) so the two never drift apart.
    """
    search = filters.get("search")
    if search:
        like = f"%{search}%"
        stmt = stmt.where(or_(Contact.name.ilike(like), Contact.phone.ilike(like),
                              Contact.email.ilike(like), Contact.company.ilike(like)))
    if filters.get("status"):
        stmt = stmt.where(Contact.status == filters["status"])
    if filters.get("tag"):
        stmt = stmt.where(Contact.tags.ilike(f"%{filters['tag']}%"))
    if filters.get("city"):
        stmt = stmt.where(Contact.city.ilike(f"%{filters['city']}%"))
    if filters.get("country"):
        stmt = stmt.where(Contact.country_code.ilike(f"%{filters['country']}%"))
    if filters.get("company"):
        stmt = stmt.where(Contact.company.ilike(f"%{filters['company']}%"))
    if filters.get("group_ids"):
        stmt = stmt.where(Contact.groups.any(Group.id.in_(filters["group_ids"])))
    if filters.get("has_email"):
        stmt = stmt.where(Contact.email.isnot(None), Contact.email != "")
    return stmt


def _segment_filters(db: Session, user: User, segment_ids: list[int]) -> list[dict]:
    segments = db.execute(
        select(Segment).where(Segment.owner_id == user.id, Segment.id.in_(segment_ids))
    ).scalars().all()
    parsed = []
    for s in segments:
        try:
            parsed.append(json.loads(s.filters) if s.filters else {})
        except (ValueError, TypeError):
            parsed.append({})
    return parsed


def resolve_audience(
    db: Session,
    user: User,
    *,
    group_ids: Optional[list[int]] = None,
    segment_ids: Optional[list[int]] = None,
    contact_ids: Optional[list[int]] = None,
    all_contacts: bool = False,
) -> list[Contact]:
    """Resolve a campaign's audience selection into concrete, messageable Contact rows.

    Sources combine with OR (union) semantics. Unsubscribed/blocked contacts
    are always excluded, regardless of which source selected them.
    """
    base = select(Contact).where(Contact.owner_id == user.id, Contact.status.notin_(EXCLUDED_STATUSES))

    if all_contacts:
        return db.execute(base).scalars().all()

    ids: set[int] = set(contact_ids or [])

    if group_ids:
        rows = db.execute(
            select(Contact.id).where(
                Contact.owner_id == user.id, Contact.groups.any(Group.id.in_(group_ids))
            )
        ).scalars().all()
        ids.update(rows)

    if segment_ids:
        for filters in _segment_filters(db, user, segment_ids):
            seg_stmt = apply_contact_filters(select(Contact.id).where(Contact.owner_id == user.id), filters)
            ids.update(db.execute(seg_stmt).scalars().all())

    if not ids:
        return []
    return db.execute(base.where(Contact.id.in_(ids))).scalars().all()


def count_audience(db: Session, user: User, **kwargs) -> int:
    return len(resolve_audience(db, user, **kwargs))
