"""WhatsApp API settings: securely store encrypted credentials & test connection."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_manager
from app.db.session import get_db
from app.models.system import EmailSetting, Setting
from app.models.user import User
from app.schemas.common import Message
from app.schemas.system import EmailSettingOut, EmailSettingUpdate, SettingOut, SettingUpdate
from app.services.activity import log_activity
from app.services.crypto import decrypt, encrypt, mask
from app.services.resend_client import ResendClient, ResendError
from app.services.whatsapp import WhatsAppClient, WhatsAppError

router = APIRouter(prefix="/settings", tags=["settings"])


def _get_or_create(db: Session, user_id: int) -> Setting:
    setting = db.execute(select(Setting).where(Setting.user_id == user_id)).scalar_one_or_none()
    if not setting:
        setting = Setting(user_id=user_id)
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting


def _to_out(s: Setting) -> SettingOut:
    return SettingOut(
        business_account_id=s.business_account_id or "",
        phone_number_id=s.phone_number_id or "",
        access_token_masked=mask(decrypt(s.access_token_enc)) or "",
        app_secret_masked=mask(decrypt(s.app_secret_enc)) or "",
        webhook_verify_token=s.webhook_verify_token or "",
        is_connected=s.is_connected,
        send_rate_per_second=s.send_rate_per_second,
        batch_size=s.batch_size,
        default_timezone=s.default_timezone,
    )


@router.get("", response_model=SettingOut)
def get_settings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _to_out(_get_or_create(db, user.id))


@router.put("", response_model=SettingOut)
def update_settings(payload: SettingUpdate, db: Session = Depends(get_db), user: User = Depends(require_manager)):
    setting = _get_or_create(db, user.id)
    if payload.business_account_id is not None:
        setting.business_account_id = payload.business_account_id
    if payload.phone_number_id is not None:
        setting.phone_number_id = payload.phone_number_id
    if payload.access_token:
        setting.access_token_enc = encrypt(payload.access_token)
    if payload.app_secret:
        setting.app_secret_enc = encrypt(payload.app_secret)
    if payload.webhook_verify_token is not None:
        setting.webhook_verify_token = payload.webhook_verify_token
    if payload.send_rate_per_second is not None:
        setting.send_rate_per_second = payload.send_rate_per_second
    if payload.batch_size is not None:
        setting.batch_size = payload.batch_size
    if payload.default_timezone is not None:
        setting.default_timezone = payload.default_timezone
    db.commit()
    db.refresh(setting)
    log_activity(db, user_id=user.id, action="settings_changed", entity="settings", entity_id=setting.id)
    return _to_out(setting)


@router.post("/test", response_model=Message)
def test_connection(db: Session = Depends(get_db), user: User = Depends(require_manager)):
    setting = _get_or_create(db, user.id)
    try:
        client = WhatsAppClient.from_setting(setting)
        info = client.test_connection()
    except WhatsAppError as exc:
        setting.is_connected = False
        db.commit()
        raise HTTPException(status_code=502, detail=str(exc))
    setting.is_connected = True
    db.commit()
    name = info.get("verified_name") or info.get("display_phone_number") or "connected"
    return Message(detail=f"Connection successful ({name})")


# --------------------------------------------------------------------- email


def _get_or_create_email(db: Session, user_id: int) -> EmailSetting:
    setting = db.execute(select(EmailSetting).where(EmailSetting.user_id == user_id)).scalar_one_or_none()
    if not setting:
        setting = EmailSetting(user_id=user_id)
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting


def _to_email_out(s: EmailSetting) -> EmailSettingOut:
    return EmailSettingOut(
        from_email=s.from_email or "",
        from_name=s.from_name or "",
        resend_api_key_masked=mask(decrypt(s.resend_api_key_enc)) or "",
        is_connected=s.is_connected,
        send_rate_per_second=s.send_rate_per_second,
        batch_size=s.batch_size,
    )


@router.get("/email", response_model=EmailSettingOut)
def get_email_settings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _to_email_out(_get_or_create_email(db, user.id))


@router.put("/email", response_model=EmailSettingOut)
def update_email_settings(
    payload: EmailSettingUpdate, db: Session = Depends(get_db), user: User = Depends(require_manager)
):
    setting = _get_or_create_email(db, user.id)
    if payload.resend_api_key:
        setting.resend_api_key_enc = encrypt(payload.resend_api_key)
    if payload.from_email is not None:
        setting.from_email = payload.from_email
    if payload.from_name is not None:
        setting.from_name = payload.from_name
    if payload.send_rate_per_second is not None:
        setting.send_rate_per_second = payload.send_rate_per_second
    if payload.batch_size is not None:
        setting.batch_size = payload.batch_size
    db.commit()
    db.refresh(setting)
    log_activity(db, user_id=user.id, action="email_settings_changed", entity="email_settings", entity_id=setting.id)
    return _to_email_out(setting)


@router.post("/email/test", response_model=Message)
def test_email_connection(db: Session = Depends(get_db), user: User = Depends(require_manager)):
    setting = _get_or_create_email(db, user.id)
    try:
        client = ResendClient.from_setting(setting)
        client.test_connection()
    except ResendError as exc:
        setting.is_connected = False
        db.commit()
        raise HTTPException(status_code=502, detail=str(exc))
    setting.is_connected = True
    db.commit()
    return Message(detail="Connection successful")
