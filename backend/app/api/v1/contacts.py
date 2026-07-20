"""Contact CRUD, search/filter, import/export, bulk operations."""
import io
import math
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.contact import Contact, Group
from app.models.enums import ContactStatus
from app.models.user import User
from app.schemas.common import IDList, Message, Page
from app.schemas.contact import (
    BulkContactUpdate,
    ContactCreate,
    ContactOut,
    ContactUpdate,
    ImportResult,
)
from app.services.activity import log_activity
from app.services.audience import apply_contact_filters, count_audience
from app.services.importer import (
    contacts_to_csv,
    contacts_to_excel,
    normalize_rows,
    parse_contacts_file,
)
from app.services.phone import normalize_phone

router = APIRouter(prefix="/contacts", tags=["contacts"])


def _load_groups(db: Session, user_id: int, ids: list[int]) -> list[Group]:
    if not ids:
        return []
    return db.execute(
        select(Group).where(Group.owner_id == user_id, Group.id.in_(ids))
    ).scalars().all()


@router.get("", response_model=Page[ContactOut])
def list_contacts(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    search: Optional[str] = None,
    status: Optional[ContactStatus] = None,
    group_id: Optional[int] = None,
    group_ids: Optional[List[int]] = Query(None),
    tag: Optional[str] = None,
    city: Optional[str] = None,
    country: Optional[str] = None,
    company: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=200),
):
    stmt = select(Contact).where(Contact.owner_id == user.id).options(selectinload(Contact.groups))
    filters = {
        "search": search, "status": status, "tag": tag, "city": city,
        "country": country, "company": company,
        "group_ids": group_ids or ([group_id] if group_id else None),
    }
    stmt = apply_contact_filters(stmt, filters)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.execute(
        stmt.order_by(Contact.created_at.desc()).offset((page - 1) * size).limit(size)
    ).scalars().all()
    return Page(items=rows, total=total, page=page, size=size, pages=math.ceil(total / size) if total else 1)


class AudienceCountRequest(BaseModel):
    group_ids: List[int] = []
    segment_ids: List[int] = []
    contact_ids: List[int] = []
    all_contacts: bool = False


class AudienceCountOut(BaseModel):
    count: int


@router.post("/audience-count", response_model=AudienceCountOut)
def audience_count(
    payload: AudienceCountRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    count = count_audience(
        db, user, group_ids=payload.group_ids, segment_ids=payload.segment_ids,
        contact_ids=payload.contact_ids, all_contacts=payload.all_contacts,
    )
    return AudienceCountOut(count=count)


@router.post("", response_model=ContactOut, status_code=201)
def create_contact(payload: ContactCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    e164, cc = normalize_phone(payload.phone)
    if not e164:
        raise HTTPException(status_code=422, detail="Invalid phone number")
    dup = db.execute(
        select(Contact).where(Contact.owner_id == user.id, Contact.phone == e164)
    ).scalar_one_or_none()
    if dup:
        raise HTTPException(status_code=409, detail="A contact with this phone number already exists")

    data = payload.model_dump(exclude={"group_ids"})
    data["phone"] = e164
    data["country_code"] = payload.country_code or cc or ""
    contact = Contact(**data, owner_id=user.id)
    contact.groups = _load_groups(db, user.id, payload.group_ids)
    db.add(contact)
    db.commit()
    db.refresh(contact)
    log_activity(db, user_id=user.id, action="contact_created", entity="contact", entity_id=contact.id)
    return contact


@router.get("/export")
def export_contacts(
    format: str = Query("csv", pattern="^(csv|excel)$"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    contacts = db.execute(select(Contact).where(Contact.owner_id == user.id)).scalars().all()
    if format == "excel":
        content = contacts_to_excel(contacts)
        media = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        fname = "contacts.xlsx"
    else:
        content = contacts_to_csv(contacts)
        media = "text/csv"
        fname = "contacts.csv"
    return StreamingResponse(
        io.BytesIO(content), media_type=media,
        headers={"Content-Disposition": f"attachment; filename={fname}"},
    )


@router.post("/import/preview")
async def import_preview(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    content = await file.read()
    rows = parse_contacts_file(content, file.filename or "upload.csv")
    return {"columns": list(rows[0].keys()) if rows else [], "rows": rows[:10], "total": len(rows)}


@router.post("/import", response_model=ImportResult)
async def import_contacts(
    file: UploadFile = File(...),
    group_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    content = await file.read()
    raw = parse_contacts_file(content, file.filename or "upload.csv")
    valid, invalid = normalize_rows(raw)

    target_group = None
    if group_id:
        target_group = db.get(Group, group_id)
        if not target_group or target_group.owner_id != user.id:
            raise HTTPException(status_code=404, detail="Group not found")

    existing_contacts = db.execute(
        select(Contact).where(Contact.owner_id == user.id)
    ).scalars().all()
    existing_by_phone = {c.phone: c for c in existing_contacts}

    imported = duplicates = 0
    seen: set[str] = set()
    for row in valid:
        phone = row["phone"]
        if phone in existing_by_phone:
            duplicates += 1
            if target_group and target_group not in existing_by_phone[phone].groups:
                existing_by_phone[phone].groups.append(target_group)
            continue
        if phone in seen:
            duplicates += 1
            continue
        seen.add(phone)
        contact = Contact(**row, owner_id=user.id, status=ContactStatus.ACTIVE)
        if target_group:
            contact.groups.append(target_group)
        db.add(contact)
        imported += 1
    db.commit()
    log_activity(db, user_id=user.id, action="contacts_imported", entity="contact",
                 detail=f"imported={imported} duplicates={duplicates} invalid={invalid}")
    return ImportResult(imported=imported, duplicates=duplicates, invalid=invalid, errors=[])


@router.get("/{contact_id}", response_model=ContactOut)
def get_contact(contact_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    contact = db.get(Contact, contact_id)
    if not contact or contact.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.put("/{contact_id}", response_model=ContactOut)
def update_contact(contact_id: int, payload: ContactUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    contact = db.get(Contact, contact_id)
    if not contact or contact.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Contact not found")
    data = payload.model_dump(exclude_unset=True)
    if "phone" in data and data["phone"]:
        e164, cc = normalize_phone(data["phone"])
        if not e164:
            raise HTTPException(status_code=422, detail="Invalid phone number")
        data["phone"] = e164
        contact.country_code = contact.country_code or cc or ""
    group_ids = data.pop("group_ids", None)
    for field, value in data.items():
        if value is not None:
            setattr(contact, field, value)
    if group_ids is not None:
        contact.groups = _load_groups(db, user.id, group_ids)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}", response_model=Message)
def delete_contact(contact_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    contact = db.get(Contact, contact_id)
    if not contact or contact.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    log_activity(db, user_id=user.id, action="contact_deleted", entity="contact", entity_id=contact_id)
    return Message(detail="Contact deleted")


@router.post("/bulk/delete", response_model=Message)
def bulk_delete(payload: IDList, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    contacts = db.execute(
        select(Contact).where(Contact.owner_id == user.id, Contact.id.in_(payload.ids))
    ).scalars().all()
    for c in contacts:
        db.delete(c)
    db.commit()
    log_activity(db, user_id=user.id, action="contacts_bulk_deleted", entity="contact",
                 detail=f"count={len(contacts)}")
    return Message(detail=f"Deleted {len(contacts)} contacts")


@router.post("/bulk/update", response_model=Message)
def bulk_update(payload: BulkContactUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    contacts = db.execute(
        select(Contact).where(Contact.owner_id == user.id, Contact.id.in_(payload.ids))
        .options(selectinload(Contact.groups))
    ).scalars().all()
    add_groups = _load_groups(db, user.id, payload.add_group_ids)
    remove_ids = set(payload.remove_group_ids)
    for c in contacts:
        if payload.status is not None:
            c.status = payload.status
        if add_groups:
            existing = {g.id for g in c.groups}
            c.groups.extend([g for g in add_groups if g.id not in existing])
        if remove_ids:
            c.groups = [g for g in c.groups if g.id not in remove_ids]
        if payload.add_tags:
            tags = set(filter(None, (c.tags or "").split(",")))
            tags.update(t.strip() for t in payload.add_tags.split(",") if t.strip())
            c.tags = ",".join(sorted(tags))
    db.commit()
    return Message(detail=f"Updated {len(contacts)} contacts")
