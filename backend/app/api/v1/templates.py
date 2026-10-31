"""WhatsApp template management + sync from Meta."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.enums import Channel, TemplateCategory, TemplateStatus
from app.models.system import Setting
from app.models.template import Template
from app.models.user import User
from app.schemas.common import Message
from app.schemas.template import TemplateCreate, TemplateOut, TemplateUpdate
from app.services.activity import log_activity
from app.services.whatsapp import WhatsAppClient, WhatsAppError

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("", response_model=list[TemplateOut])
def list_templates(
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
    category: Optional[TemplateCategory] = None, favorite: Optional[bool] = None,
    channel: Optional[Channel] = None,
):
    stmt = select(Template).where(Template.owner_id == user.id)
    if category:
        stmt = stmt.where(Template.category == category)
    if favorite is not None:
        stmt = stmt.where(Template.is_favorite == favorite)
    if channel:
        stmt = stmt.where(Template.channel == channel)
    return db.execute(stmt.order_by(Template.is_favorite.desc(), Template.name)).scalars().all()


@router.post("", response_model=TemplateOut, status_code=201)
def create_template(payload: TemplateCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Email templates have no Meta-style approval workflow — approve immediately.
    initial_status = TemplateStatus.APPROVED if payload.channel == Channel.EMAIL else TemplateStatus.DRAFT
    template = Template(**payload.model_dump(), owner_id=user.id, status=initial_status)
    db.add(template)
    db.commit()
    db.refresh(template)
    log_activity(db, user_id=user.id, action="template_created", entity="template", entity_id=template.id)
    return template


@router.put("/{template_id}", response_model=TemplateOut)
def update_template(template_id: int, payload: TemplateUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    template = _owned(db, template_id, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(template, field, value)
    db.commit()
    db.refresh(template)
    log_activity(db, user_id=user.id, action="template_updated", entity="template", entity_id=template.id)
    return template


@router.delete("/{template_id}", response_model=Message)
def delete_template(template_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    template = _owned(db, template_id, user)
    db.delete(template)
    db.commit()
    return Message(detail="Template deleted")


@router.post("/sync", response_model=Message)
def sync_templates(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    setting = db.execute(select(Setting).where(Setting.user_id == user.id)).scalar_one_or_none()
    try:
        client = WhatsAppClient.from_setting(setting)
        remote = client.list_templates()
    except WhatsAppError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    synced = 0
    for tpl in remote:
        name = tpl.get("name")
        if not name:
            continue
        existing = db.execute(
            select(Template).where(
                Template.owner_id == user.id, Template.name == name, Template.channel == Channel.WHATSAPP
            )
        ).scalar_one_or_none()
        body = ""
        header = ""
        header_type = ""
        footer = ""
        for comp in tpl.get("components", []):
            ctype = comp.get("type", "").upper()
            if ctype == "BODY":
                body = comp.get("text", "")
            elif ctype == "HEADER":
                header = comp.get("text", "") or ""
                header_type = (comp.get("format") or "TEXT").upper()
            elif ctype == "FOOTER":
                footer = comp.get("text", "")
        category = (tpl.get("category") or "MARKETING").lower()
        status_map = {"APPROVED": TemplateStatus.APPROVED, "PENDING": TemplateStatus.PENDING,
                      "REJECTED": TemplateStatus.REJECTED}
        fields = dict(
            channel=Channel.WHATSAPP,
            language=tpl.get("language", "en_US"),
            category=TemplateCategory(category) if category in TemplateCategory._value2member_map_ else TemplateCategory.MARKETING,
            status=status_map.get(tpl.get("status", ""), TemplateStatus.APPROVED),
            body=body, header=header, header_type=header_type, footer=footer,
            wa_template_id=str(tpl.get("id", "")),
        )
        if existing:
            for k, v in fields.items():
                setattr(existing, k, v)
        else:
            db.add(Template(name=name, owner_id=user.id, **fields))
        synced += 1
    db.commit()
    log_activity(db, user_id=user.id, action="templates_synced", entity="template", detail=f"count={synced}")
    return Message(detail=f"Synced {synced} templates")


def _owned(db: Session, template_id: int, user: User) -> Template:
    template = db.get(Template, template_id)
    if not template or template.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Template not found")
    return template
