"""WhatsApp Cloud API webhook receiver for delivery/read status updates."""
import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.campaign import Campaign, CampaignRecipient
from app.models.enums import MessageStatus
from app.models.system import Setting, WebhookLog

logger = logging.getLogger("axiora.webhook")
router = APIRouter(prefix="/webhooks", tags=["webhooks"])

_STATUS_MAP = {
    "sent": MessageStatus.SENT,
    "delivered": MessageStatus.DELIVERED,
    "read": MessageStatus.READ,
    "failed": MessageStatus.FAILED,
}


@router.get("/whatsapp")
def verify_webhook(
    hub_mode: str = Query("", alias="hub.mode"),
    hub_challenge: str = Query("", alias="hub.challenge"),
    hub_verify_token: str = Query("", alias="hub.verify_token"),
    db: Session = Depends(get_db),
):
    """Meta webhook verification handshake."""
    tokens = db.execute(select(Setting.webhook_verify_token)).scalars().all()
    if hub_mode == "subscribe" and hub_verify_token and hub_verify_token in set(filter(None, tokens)):
        return Response(content=hub_challenge, media_type="text/plain")
    return Response(status_code=403, content="Verification failed")


@router.post("/whatsapp")
async def receive_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    db.add(WebhookLog(event_type="whatsapp", payload=json.dumps(body)[:8000], processed=False))
    db.commit()

    try:
        _process(db, body)
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Failed to process webhook: %s", exc)
    return {"status": "ok"}


def _process(db: Session, body: dict) -> None:
    for entry in body.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for status in value.get("statuses", []):
                _apply_status(db, status)


def _apply_status(db: Session, status: dict) -> None:
    wa_id = status.get("id")
    state = status.get("status")
    if not wa_id or state not in _STATUS_MAP:
        return
    recipient = db.execute(
        select(CampaignRecipient).where(CampaignRecipient.provider_message_id == wa_id)
    ).scalar_one_or_none()
    if not recipient:
        return

    new_status = _STATUS_MAP[state]
    # Never downgrade (read > delivered > sent).
    order = {MessageStatus.SENT: 1, MessageStatus.DELIVERED: 2, MessageStatus.READ: 3, MessageStatus.FAILED: 1}
    if order.get(new_status, 0) >= order.get(recipient.status, 0) or new_status == MessageStatus.FAILED:
        recipient.status = new_status
    now = datetime.now(timezone.utc)
    if new_status == MessageStatus.DELIVERED:
        recipient.delivered_at = now
    elif new_status == MessageStatus.READ:
        recipient.read_at = now
        recipient.delivered_at = recipient.delivered_at or now
    elif new_status == MessageStatus.FAILED:
        errors = status.get("errors", [{}])
        recipient.error_code = str(errors[0].get("code", ""))
        recipient.error_message = errors[0].get("title", "Failed")

    # Update campaign counters incrementally.
    campaign = db.get(Campaign, recipient.campaign_id)
    if campaign:
        if new_status == MessageStatus.DELIVERED:
            campaign.delivered_count += 1
        elif new_status == MessageStatus.READ:
            campaign.read_count += 1
        elif new_status == MessageStatus.FAILED:
            campaign.failed_count += 1
    db.commit()
