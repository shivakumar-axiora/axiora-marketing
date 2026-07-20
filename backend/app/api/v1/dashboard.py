"""Dashboard stats + chart data + recent activity."""
from collections import OrderedDict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.campaign import Campaign, CampaignRecipient
from app.models.contact import Contact
from app.models.enums import CampaignStatus, MessageStatus
from app.models.system import ActivityLog
from app.models.user import User
from app.schemas.campaign import CampaignOut
from app.schemas.system import ActivityLogOut, DashboardCharts, DashboardStats, TimeSeriesPoint

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _count(db, stmt) -> int:
    return db.scalar(select(func.count()).select_from(stmt.subquery())) or 0


def _aware(dt: datetime) -> datetime:
    """Coerce a possibly-naive datetime (e.g. from SQLite) to UTC-aware."""
    if dt is None:
        return dt
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


@router.get("/stats", response_model=DashboardStats)
def dashboard_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    uid = user.id
    total_contacts = _count(db, select(Contact.id).where(Contact.owner_id == uid))
    total_campaigns = _count(db, select(Campaign.id).where(Campaign.owner_id == uid))
    active = _count(db, select(Campaign.id).where(Campaign.owner_id == uid,
                    Campaign.status.in_([CampaignStatus.RUNNING, CampaignStatus.PAUSED])))
    scheduled = _count(db, select(Campaign.id).where(Campaign.owner_id == uid,
                       Campaign.status == CampaignStatus.SCHEDULED))

    rec = select(CampaignRecipient).join(Campaign).where(Campaign.owner_id == uid)
    def rec_count(status):
        return _count(db, rec.where(CampaignRecipient.status == status))

    sent = _count(db, rec.where(CampaignRecipient.status.in_(
        [MessageStatus.SENT, MessageStatus.DELIVERED, MessageStatus.READ])))
    delivered = _count(db, rec.where(CampaignRecipient.status.in_(
        [MessageStatus.DELIVERED, MessageStatus.READ])))
    read = rec_count(MessageStatus.READ)
    failed = rec_count(MessageStatus.FAILED)
    pending = _count(db, rec.where(CampaignRecipient.status.in_(
        [MessageStatus.PENDING, MessageStatus.QUEUED])))

    total_attempted = sent + failed
    success_rate = round((sent / total_attempted) * 100, 1) if total_attempted else 0.0
    delivery_rate = round((delivered / sent) * 100, 1) if sent else 0.0

    start_today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    todays = _count(db, select(Campaign.id).where(Campaign.owner_id == uid, Campaign.created_at >= start_today))

    return DashboardStats(
        total_contacts=total_contacts, total_campaigns=total_campaigns, active_campaigns=active,
        scheduled_campaigns=scheduled, messages_sent=sent, messages_delivered=delivered,
        messages_read=read, failed_messages=failed, pending_messages=pending,
        success_rate=success_rate, delivery_rate=delivery_rate, todays_campaigns=todays,
    )


@router.get("/charts", response_model=DashboardCharts)
def dashboard_charts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    uid = user.id
    now = datetime.now(timezone.utc)

    # Daily messages (last 7 days)
    daily = OrderedDict()
    for i in range(6, -1, -1):
        day = (now - timedelta(days=i)).date()
        daily[day.isoformat()] = 0
    rows = db.execute(
        select(CampaignRecipient.sent_at).join(Campaign)
        .where(Campaign.owner_id == uid, CampaignRecipient.sent_at.isnot(None),
               CampaignRecipient.sent_at >= now - timedelta(days=7))
    ).scalars().all()
    for sent_at in rows:
        key = _aware(sent_at).date().isoformat()
        if key in daily:
            daily[key] += 1
    daily_messages = [TimeSeriesPoint(label=k[5:], value=v) for k, v in daily.items()]

    # Weekly campaigns (last 4 weeks)
    weekly = OrderedDict()
    for i in range(3, -1, -1):
        weekly[f"W-{i}"] = 0
    camp_rows = db.execute(
        select(Campaign.created_at).where(Campaign.owner_id == uid,
               Campaign.created_at >= now - timedelta(weeks=4))
    ).scalars().all()
    for created in camp_rows:
        weeks_ago = (now - _aware(created)).days // 7
        key = f"W-{min(weeks_ago, 3)}"
        weekly[key] = weekly.get(key, 0) + 1
    weekly_campaigns = [TimeSeriesPoint(label=k, value=v) for k, v in reversed(list(weekly.items()))]

    # Delivery stats breakdown
    def status_count(statuses):
        return _count(db, select(CampaignRecipient).join(Campaign)
                      .where(Campaign.owner_id == uid, CampaignRecipient.status.in_(statuses)))
    delivery_stats = [
        TimeSeriesPoint(label="Sent", value=status_count([MessageStatus.SENT])),
        TimeSeriesPoint(label="Delivered", value=status_count([MessageStatus.DELIVERED])),
        TimeSeriesPoint(label="Read", value=status_count([MessageStatus.READ])),
        TimeSeriesPoint(label="Failed", value=status_count([MessageStatus.FAILED])),
        TimeSeriesPoint(label="Pending", value=status_count([MessageStatus.PENDING, MessageStatus.QUEUED])),
    ]

    # Campaign performance (top 5 recent campaigns by delivered)
    top = db.execute(
        select(Campaign).where(Campaign.owner_id == uid).order_by(Campaign.created_at.desc()).limit(5)
    ).scalars().all()
    campaign_performance = [TimeSeriesPoint(label=c.name[:14], value=c.delivered_count) for c in top]

    return DashboardCharts(
        daily_messages=daily_messages, weekly_campaigns=weekly_campaigns,
        delivery_stats=delivery_stats, campaign_performance=campaign_performance,
    )


@router.get("/recent-campaigns", response_model=list[CampaignOut])
def recent_campaigns(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.execute(
        select(Campaign).where(Campaign.owner_id == user.id)
        .order_by(Campaign.created_at.desc()).limit(8)
    ).scalars().all()


@router.get("/recent-activity", response_model=list[ActivityLogOut])
def recent_activity(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.execute(
        select(ActivityLog).where(ActivityLog.user_id == user.id)
        .order_by(ActivityLog.created_at.desc()).limit(12)
    ).scalars().all()
