"""Campaign CRUD + lifecycle (send/pause/resume/cancel/clone/archive/retry)."""
import json
import math
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.celery_app import dispatch_campaign
from app.core.config import settings
from app.db.session import get_db
from app.models.campaign import Campaign, CampaignLog, CampaignRecipient
from app.models.contact import Contact
from app.models.enums import CampaignStatus, Channel, MessageStatus, ScheduleType, TemplateStatus
from app.models.user import User
from app.schemas.campaign import (
    CampaignCreate,
    CampaignLogOut,
    CampaignOut,
    CampaignPreview,
    CampaignUpdate,
    RecipientOut,
)
from app.schemas.common import Message, Page
from app.services.activity import log_activity, notify
from app.services.audience import resolve_audience
from app.services.messaging import contact_context, is_valid_email, render_message
from app.services.sending import retry_failed

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


def _build_recipients(db: Session, campaign: Campaign, contacts: list[Contact]) -> None:
    db.execute(
        CampaignRecipient.__table__.delete().where(CampaignRecipient.campaign_id == campaign.id)
    )
    added = 0
    skipped = 0
    if campaign.channel == Channel.EMAIL:
        if campaign.template_id and campaign.template:
            subject_src = campaign.template.subject or ""
            body_src = campaign.template.html_body or ""
        else:
            subject_src = campaign.subject or ""
            body_src = campaign.message_body or ""
        for c in contacts:
            if not is_valid_email(c.email or ""):
                skipped += 1
                continue
            ctx = contact_context(c)
            db.add(CampaignRecipient(
                campaign_id=campaign.id, contact_id=c.id, email=c.email,
                rendered_subject=render_message(subject_src, ctx),
                rendered_message=render_message(body_src, ctx),
                status=MessageStatus.PENDING,
            ))
            added += 1
        if skipped:
            db.add(CampaignLog(
                campaign_id=campaign.id, level="warning", event="recipients_skipped",
                message=f"{skipped} contact(s) skipped: missing or invalid email address",
            ))
    else:
        for c in contacts:
            rendered = render_message(campaign.message_body or "", contact_context(c))
            db.add(CampaignRecipient(campaign_id=campaign.id, contact_id=c.id, phone=c.phone,
                                     rendered_message=rendered, status=MessageStatus.PENDING))
            added += 1
    campaign.total_recipients = added


@router.get("", response_model=Page[CampaignOut])
def list_campaigns(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    search: Optional[str] = None,
    status: Optional[CampaignStatus] = None,
    channel: Optional[Channel] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=200),
):
    stmt = select(Campaign).where(Campaign.owner_id == user.id)
    if search:
        stmt = stmt.where(Campaign.name.ilike(f"%{search}%"))
    if status:
        stmt = stmt.where(Campaign.status == status)
    if channel:
        stmt = stmt.where(Campaign.channel == channel)
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.execute(
        stmt.order_by(Campaign.created_at.desc()).offset((page - 1) * size).limit(size)
    ).scalars().all()
    return Page(items=rows, total=total, page=page, size=size, pages=math.ceil(total / size) if total else 1)


@router.post("", response_model=CampaignOut, status_code=201)
def create_campaign(payload: CampaignCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    data = payload.model_dump(exclude={"group_ids", "segment_ids", "contact_ids", "all_contacts", "template_variables"})
    campaign = Campaign(
        **data,
        owner_id=user.id,
        template_variables=json.dumps(payload.template_variables) if payload.template_variables else "",
        status=CampaignStatus.DRAFT,
    )
    db.add(campaign)
    db.flush()
    contacts = resolve_audience(
        db, user, group_ids=payload.group_ids, segment_ids=payload.segment_ids,
        contact_ids=payload.contact_ids, all_contacts=payload.all_contacts,
    )
    _build_recipients(db, campaign, contacts)
    db.commit()
    db.refresh(campaign)
    log_activity(db, user_id=user.id, action="campaign_created", entity="campaign", entity_id=campaign.id)
    return campaign


@router.get("/{campaign_id}", response_model=CampaignOut)
def get_campaign(campaign_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    campaign = _owned(db, campaign_id, user)
    return campaign


@router.put("/{campaign_id}", response_model=CampaignOut)
def update_campaign(campaign_id: int, payload: CampaignUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    campaign = _owned(db, campaign_id, user)
    if campaign.status in (CampaignStatus.RUNNING, CampaignStatus.COMPLETED):
        raise HTTPException(status_code=400, detail="Cannot edit a running or completed campaign")
    if payload.channel is not None and payload.channel != campaign.channel:
        raise HTTPException(status_code=400, detail="Cannot change a campaign's channel after creation")
    data = payload.model_dump(
        exclude_unset=True, exclude={"group_ids", "segment_ids", "contact_ids", "all_contacts", "template_variables"}
    )
    for field, value in data.items():
        setattr(campaign, field, value)
    if payload.template_variables is not None:
        campaign.template_variables = json.dumps(payload.template_variables)
    if any(f is not None for f in (payload.group_ids, payload.segment_ids, payload.contact_ids, payload.all_contacts)):
        contacts = resolve_audience(
            db, user, group_ids=payload.group_ids or [], segment_ids=payload.segment_ids or [],
            contact_ids=payload.contact_ids or [], all_contacts=payload.all_contacts or False,
        )
        _build_recipients(db, campaign, contacts)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.get("/{campaign_id}/preview", response_model=CampaignPreview)
def preview_campaign(campaign_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    campaign = _owned(db, campaign_id, user)
    recipients = db.execute(
        select(CampaignRecipient).where(CampaignRecipient.campaign_id == campaign_id).limit(3)
    ).scalars().all()
    rate = settings.SEND_RATE_PER_SECOND or 10
    return CampaignPreview(
        recipient_count=campaign.total_recipients,
        sample_messages=[r.rendered_message or campaign.message_body or "" for r in recipients],
        sample_subjects=(
            [r.rendered_subject or campaign.subject or "" for r in recipients]
            if campaign.channel == Channel.EMAIL else []
        ),
        estimated_seconds=math.ceil(campaign.total_recipients / rate) if campaign.total_recipients else 0,
    )


@router.get("/{campaign_id}/recipients", response_model=Page[RecipientOut])
def list_recipients(
    campaign_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user),
    status: Optional[MessageStatus] = None, page: int = Query(1, ge=1), size: int = Query(50, ge=1, le=500),
):
    _owned(db, campaign_id, user)
    stmt = select(CampaignRecipient).where(CampaignRecipient.campaign_id == campaign_id)
    if status:
        stmt = stmt.where(CampaignRecipient.status == status)
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.execute(stmt.offset((page - 1) * size).limit(size)).scalars().all()
    return Page(items=rows, total=total, page=page, size=size, pages=math.ceil(total / size) if total else 1)


@router.get("/{campaign_id}/logs", response_model=list[CampaignLogOut])
def campaign_logs(campaign_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _owned(db, campaign_id, user)
    return db.execute(
        select(CampaignLog).where(CampaignLog.campaign_id == campaign_id).order_by(CampaignLog.created_at.desc())
    ).scalars().all()


# ----------------------------------------------------------------- lifecycle
@router.post("/{campaign_id}/send", response_model=CampaignOut)
def send_campaign(
    campaign_id: int, background: BackgroundTasks,
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
):
    campaign = _owned(db, campaign_id, user)
    if campaign.total_recipients == 0:
        raise HTTPException(status_code=400, detail="Campaign has no recipients")
    if campaign.status not in (CampaignStatus.DRAFT, CampaignStatus.SCHEDULED, CampaignStatus.FAILED,
                               CampaignStatus.CANCELLED):
        raise HTTPException(status_code=400, detail=f"Cannot send a {campaign.status.value} campaign")
    if campaign.channel == Channel.WHATSAPP and campaign.template_id:
        if not campaign.template or campaign.template.status != TemplateStatus.APPROVED:
            raise HTTPException(
                status_code=400,
                detail="This campaign's WhatsApp template is not approved yet. "
                       "Create/submit it in Meta Business Manager, wait for approval, "
                       "then sync templates before sending.",
            )

    if campaign.schedule_type != ScheduleType.IMMEDIATE and campaign.scheduled_at:
        campaign.status = CampaignStatus.SCHEDULED
        db.commit()
        log_activity(db, user_id=user.id, action="campaign_scheduled", entity="campaign", entity_id=campaign.id)
        # A scheduler (Celery beat / cron) will invoke dispatch when scheduled_at is reached.
    else:
        campaign.status = CampaignStatus.RUNNING
        db.commit()
        notify(db, user_id=user.id, title="Campaign started", body=campaign.name, type="info")
        log_activity(db, user_id=user.id, action="campaign_started", entity="campaign", entity_id=campaign.id)
        if settings.USE_CELERY:
            dispatch_campaign(campaign.id)
        else:
            from app.services.sending import run_campaign
            background.add_task(run_campaign, campaign.id)
    db.refresh(campaign)
    return campaign


@router.post("/{campaign_id}/pause", response_model=CampaignOut)
def pause_campaign(campaign_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    campaign = _owned(db, campaign_id, user)
    if campaign.status != CampaignStatus.RUNNING:
        raise HTTPException(status_code=400, detail="Only running campaigns can be paused")
    campaign.status = CampaignStatus.PAUSED
    db.commit()
    log_activity(db, user_id=user.id, action="campaign_paused", entity="campaign", entity_id=campaign.id)
    db.refresh(campaign)
    return campaign


@router.post("/{campaign_id}/resume", response_model=CampaignOut)
def resume_campaign(
    campaign_id: int, background: BackgroundTasks,
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
):
    campaign = _owned(db, campaign_id, user)
    if campaign.status != CampaignStatus.PAUSED:
        raise HTTPException(status_code=400, detail="Only paused campaigns can be resumed")
    campaign.status = CampaignStatus.RUNNING
    db.commit()
    if settings.USE_CELERY:
        dispatch_campaign(campaign.id)
    else:
        from app.services.sending import run_campaign
        background.add_task(run_campaign, campaign.id)
    log_activity(db, user_id=user.id, action="campaign_resumed", entity="campaign", entity_id=campaign.id)
    db.refresh(campaign)
    return campaign


@router.post("/{campaign_id}/cancel", response_model=CampaignOut)
def cancel_campaign(campaign_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    campaign = _owned(db, campaign_id, user)
    if campaign.status in (CampaignStatus.COMPLETED, CampaignStatus.ARCHIVED):
        raise HTTPException(status_code=400, detail="Campaign already finished")
    campaign.status = CampaignStatus.CANCELLED
    db.commit()
    log_activity(db, user_id=user.id, action="campaign_cancelled", entity="campaign", entity_id=campaign.id)
    db.refresh(campaign)
    return campaign


@router.post("/{campaign_id}/archive", response_model=CampaignOut)
def archive_campaign(campaign_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    campaign = _owned(db, campaign_id, user)
    campaign.status = CampaignStatus.ARCHIVED
    db.commit()
    db.refresh(campaign)
    return campaign


@router.post("/{campaign_id}/retry", response_model=Message)
def retry_campaign(
    campaign_id: int, background: BackgroundTasks,
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
):
    campaign = _owned(db, campaign_id, user)
    count = retry_failed(campaign_id)
    if count and not settings.USE_CELERY:
        from app.services.sending import run_campaign
        background.add_task(run_campaign, campaign_id)
    elif count:
        dispatch_campaign(campaign_id)
    return Message(detail=f"Requeued {count} failed messages")


@router.post("/{campaign_id}/clone", response_model=CampaignOut, status_code=201)
def clone_campaign(campaign_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    src = _owned(db, campaign_id, user)
    clone = Campaign(
        name=f"{src.name} (Copy)", description=src.description, channel=src.channel,
        subject=src.subject, message_body=src.message_body,
        schedule_type=ScheduleType.IMMEDIATE, timezone=src.timezone, template_id=src.template_id,
        media_id=src.media_id, template_variables=src.template_variables, owner_id=user.id,
        status=CampaignStatus.DRAFT,
    )
    db.add(clone)
    db.flush()
    src_recipients = db.execute(
        select(CampaignRecipient).where(CampaignRecipient.campaign_id == src.id)
    ).scalars().all()
    for r in src_recipients:
        db.add(CampaignRecipient(campaign_id=clone.id, contact_id=r.contact_id, phone=r.phone,
                                 email=r.email, rendered_subject=r.rendered_subject,
                                 rendered_message=r.rendered_message, status=MessageStatus.PENDING))
    clone.total_recipients = len(src_recipients)
    db.commit()
    db.refresh(clone)
    return clone


@router.delete("/{campaign_id}", response_model=Message)
def delete_campaign(campaign_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    campaign = _owned(db, campaign_id, user)
    db.delete(campaign)
    db.commit()
    log_activity(db, user_id=user.id, action="campaign_deleted", entity="campaign", entity_id=campaign_id)
    return Message(detail="Campaign deleted")


def _owned(db: Session, campaign_id: int, user: User) -> Campaign:
    campaign = db.get(Campaign, campaign_id)
    if not campaign or campaign.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign
