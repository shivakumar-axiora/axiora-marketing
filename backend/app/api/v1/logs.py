"""Activity logs & webhook logs (admins see all; users see their own activity)."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models.enums import RoleName
from app.models.system import ActivityLog, WebhookLog
from app.models.user import User
from app.schemas.system import ActivityLogOut, WebhookLogOut

router = APIRouter(prefix="/logs", tags=["logs"])


@router.get("/activity", response_model=list[ActivityLogOut])
def activity_logs(db: Session = Depends(get_db), user: User = Depends(get_current_user), limit: int = 100):
    stmt = select(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit)
    if user.role.name != RoleName.ADMIN.value:
        stmt = select(ActivityLog).where(ActivityLog.user_id == user.id).order_by(
            ActivityLog.created_at.desc()).limit(limit)
    return db.execute(stmt).scalars().all()


@router.get("/webhooks", response_model=list[WebhookLogOut])
def webhook_logs(db: Session = Depends(get_db), _: User = Depends(require_admin), limit: int = 100):
    return db.execute(
        select(WebhookLog).order_by(WebhookLog.created_at.desc()).limit(limit)
    ).scalars().all()
