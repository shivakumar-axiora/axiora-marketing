"""Queue-based campaign sending engine.

Processes a campaign's recipients in configurable batches, respects a rate limit,
retries transient failures, and keeps campaign counters + logs up to date.

Runs via FastAPI BackgroundTasks by default, or as a Celery task when USE_CELERY=true.
The engine re-checks campaign status each batch so pause/cancel take effect promptly.
"""
from __future__ import annotations

import json
import logging
import time
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.campaign import Campaign, CampaignLog, CampaignRecipient
from app.models.enums import CampaignStatus, Channel, MessageStatus
from app.services.messaging import contact_context
from app.services.resend_client import ResendClient, ResendError
from app.services.whatsapp import WhatsAppClient, WhatsAppError

logger = logging.getLogger("axiora.sending")

# Meta error codes considered transient / retryable.
RETRYABLE_CODES = {"130429", "131056", "132000", "500", "503", "80007", "133016"}

# Resend error codes considered transient / retryable.
RESEND_RETRYABLE_CODES = {"rate_limit_exceeded", "internal_server_error", "application_error"}


def _log(db: Session, campaign_id: int, event: str, message: str = "", level: str = "info") -> None:
    db.add(CampaignLog(campaign_id=campaign_id, event=event, message=message, level=level))
    db.commit()


def _refresh_counters(db: Session, campaign: Campaign) -> None:
    rows = db.execute(
        select(CampaignRecipient.status).where(CampaignRecipient.campaign_id == campaign.id)
    ).scalars().all()
    campaign.sent_count = sum(
        1 for s in rows if s in (MessageStatus.SENT, MessageStatus.DELIVERED, MessageStatus.READ)
    )
    campaign.delivered_count = sum(
        1 for s in rows if s in (MessageStatus.DELIVERED, MessageStatus.READ)
    )
    campaign.read_count = sum(1 for s in rows if s == MessageStatus.READ)
    campaign.failed_count = sum(1 for s in rows if s == MessageStatus.FAILED)
    db.commit()


def run_campaign(campaign_id: int) -> None:
    """Entry point invoked by the background worker."""
    db = SessionLocal()
    try:
        campaign = db.get(Campaign, campaign_id)
        if not campaign:
            return
        if campaign.status not in (CampaignStatus.SCHEDULED, CampaignStatus.RUNNING, CampaignStatus.PAUSED):
            return

        if campaign.channel == Channel.EMAIL:
            from app.models.system import EmailSetting

            setting = db.execute(
                select(EmailSetting).where(EmailSetting.user_id == campaign.owner_id)
            ).scalar_one_or_none()
            try:
                client = ResendClient.from_setting(setting)
            except ResendError as exc:
                campaign.status = CampaignStatus.FAILED
                db.commit()
                _log(db, campaign_id, "error", str(exc), level="error")
                return
        else:
            from app.models.system import Setting

            setting = db.execute(
                select(Setting).where(Setting.user_id == campaign.owner_id)
            ).scalar_one_or_none()
            try:
                client = WhatsAppClient.from_setting(setting)
            except WhatsAppError as exc:
                campaign.status = CampaignStatus.FAILED
                db.commit()
                _log(db, campaign_id, "error", str(exc), level="error")
                return

        campaign.status = CampaignStatus.RUNNING
        db.commit()
        _log(db, campaign_id, "campaign_started", f"Sending to {campaign.total_recipients} recipients")

        rate = max(1, (setting.send_rate_per_second if setting else settings.SEND_RATE_PER_SECOND))
        batch_size = max(1, (setting.batch_size if setting else settings.SEND_BATCH_SIZE))
        delay = 1.0 / rate

        while True:
            db.refresh(campaign)
            if campaign.status == CampaignStatus.PAUSED:
                _log(db, campaign_id, "campaign_paused", "Paused by user")
                return
            if campaign.status == CampaignStatus.CANCELLED:
                _log(db, campaign_id, "campaign_cancelled", "Cancelled by user")
                return

            pending = db.execute(
                select(CampaignRecipient)
                .where(
                    CampaignRecipient.campaign_id == campaign_id,
                    CampaignRecipient.status.in_([MessageStatus.PENDING, MessageStatus.QUEUED]),
                )
                .limit(batch_size)
            ).scalars().all()

            if not pending:
                break

            for recipient in pending:
                _send_one(db, campaign, recipient, client)
                time.sleep(delay)

            _refresh_counters(db, campaign)

        _refresh_counters(db, campaign)
        db.refresh(campaign)
        if campaign.status == CampaignStatus.RUNNING:
            campaign.status = CampaignStatus.COMPLETED
            db.commit()
            _log(db, campaign_id, "campaign_completed",
                 f"Sent {campaign.sent_count}, failed {campaign.failed_count}")
    finally:
        db.close()


def _build_template_components(campaign: Campaign, recipient: CampaignRecipient) -> list:
    """Build WhatsApp body components from campaign variable mappings."""
    if not campaign.template_variables:
        return []
    try:
        var_map: dict = json.loads(campaign.template_variables)  # e.g. {"1": "name", "2": "company"}
    except (ValueError, TypeError):
        return []
    if not var_map:
        return []
    ctx = contact_context(recipient.contact)
    params = [
        {"type": "text", "text": ctx.get(var_map[k], "")}
        for k in sorted(var_map.keys(), key=lambda x: int(x) if x.isdigit() else x)
    ]
    return [{"type": "body", "parameters": params}]


def _send_one(
    db: Session, campaign: Campaign, recipient: CampaignRecipient, client: "WhatsAppClient | ResendClient"
) -> None:
    try:
        if campaign.channel == Channel.EMAIL:
            resp = client.send_email(
                to=recipient.email,
                subject=recipient.rendered_subject or campaign.subject or "",
                html=recipient.rendered_message or campaign.message_body or "",
            )
            remote_id = resp.get("id", "") if isinstance(resp, dict) else ""
        elif campaign.template_id and campaign.template:
            resp = client.send_template(
                to=recipient.phone,
                template_name=campaign.template.name,
                language=campaign.template.language,
                components=_build_template_components(campaign, recipient),
            )
            msgs = resp.get("messages") if isinstance(resp, dict) else None
            remote_id = msgs[0].get("id", "") if msgs else ""
        elif campaign.media_id and campaign.media:
            resp = client.send_media(
                to=recipient.phone,
                media_type=campaign.media.media_type.value,
                link=campaign.media.url,
                caption=recipient.rendered_message or "",
            )
            msgs = resp.get("messages") if isinstance(resp, dict) else None
            remote_id = msgs[0].get("id", "") if msgs else ""
        else:
            resp = client.send_text(recipient.phone, recipient.rendered_message or campaign.message_body or "")
            msgs = resp.get("messages") if isinstance(resp, dict) else None
            remote_id = msgs[0].get("id", "") if msgs else ""

        recipient.provider_message_id = remote_id
        recipient.status = MessageStatus.SENT
        recipient.sent_at = datetime.now(timezone.utc)
        recipient.error_code = ""
        recipient.error_message = ""
    except (WhatsAppError, ResendError) as exc:
        retryable_codes = RESEND_RETRYABLE_CODES if isinstance(exc, ResendError) else RETRYABLE_CODES
        if exc.code in retryable_codes and recipient.retries < settings.MAX_SEND_RETRIES:
            recipient.retries += 1
            recipient.status = MessageStatus.QUEUED
            recipient.error_code = exc.code
            recipient.error_message = exc.message
        else:
            recipient.status = MessageStatus.FAILED
            recipient.error_code = exc.code
            recipient.error_message = exc.message
    db.commit()


def retry_failed(campaign_id: int) -> int:
    """Requeue failed recipients for another send pass."""
    db = SessionLocal()
    try:
        recipients = db.execute(
            select(CampaignRecipient).where(
                CampaignRecipient.campaign_id == campaign_id,
                CampaignRecipient.status == MessageStatus.FAILED,
            )
        ).scalars().all()
        for r in recipients:
            r.status = MessageStatus.PENDING
            r.retries = 0
        campaign = db.get(Campaign, campaign_id)
        if campaign and recipients:
            campaign.status = CampaignStatus.RUNNING
        db.commit()
        return len(recipients)
    finally:
        db.close()
