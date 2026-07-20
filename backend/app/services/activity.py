"""Helpers to record activity logs and notifications."""
from sqlalchemy.orm import Session

from app.models.system import ActivityLog, Notification


def log_activity(
    db: Session,
    *,
    user_id: int | None,
    action: str,
    entity: str = "",
    entity_id: str = "",
    detail: str = "",
    ip_address: str = "",
    commit: bool = True,
) -> ActivityLog:
    entry = ActivityLog(
        user_id=user_id,
        action=action,
        entity=entity,
        entity_id=str(entity_id),
        detail=detail,
        ip_address=ip_address,
    )
    db.add(entry)
    if commit:
        db.commit()
    return entry


def notify(
    db: Session,
    *,
    user_id: int,
    title: str,
    body: str = "",
    type: str = "info",
    link: str = "",
    commit: bool = True,
) -> Notification:
    n = Notification(user_id=user_id, title=title, body=body, type=type, link=link)
    db.add(n)
    if commit:
        db.commit()
    return n
