"""Segment CRUD — saved, dynamic contact filters."""
import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.contact import Contact, Segment
from app.models.user import User
from app.schemas.common import Message
from app.schemas.contact import SegmentCreate, SegmentOut, SegmentPreview, SegmentUpdate
from app.services.activity import log_activity
from app.services.audience import EXCLUDED_STATUSES, apply_contact_filters, count_audience

router = APIRouter(prefix="/segments", tags=["segments"])


def _filters(s: Segment) -> dict:
    try:
        return json.loads(s.filters) if s.filters else {}
    except (ValueError, TypeError):
        return {}


def _to_out(db: Session, user: User, s: Segment) -> SegmentOut:
    filters = _filters(s)
    return SegmentOut(
        id=s.id, name=s.name, description=s.description or "", filters=filters,
        matching_count=count_audience(db, user, segment_ids=[s.id]), created_at=s.created_at,
    )


@router.get("", response_model=list[SegmentOut])
def list_segments(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    segments = db.execute(
        select(Segment).where(Segment.owner_id == user.id).order_by(Segment.name)
    ).scalars().all()
    return [_to_out(db, user, s) for s in segments]


@router.post("", response_model=SegmentOut, status_code=201)
def create_segment(payload: SegmentCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    exists = db.execute(
        select(Segment).where(Segment.owner_id == user.id, Segment.name == payload.name)
    ).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=400, detail="A segment with this name already exists")
    segment = Segment(
        name=payload.name, description=payload.description or "",
        filters=json.dumps(payload.filters), owner_id=user.id,
    )
    db.add(segment)
    db.commit()
    db.refresh(segment)
    log_activity(db, user_id=user.id, action="segment_created", entity="segment", entity_id=segment.id)
    return _to_out(db, user, segment)


@router.put("/{segment_id}", response_model=SegmentOut)
def update_segment(segment_id: int, payload: SegmentUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    segment = _owned(db, segment_id, user)
    if payload.name is not None:
        segment.name = payload.name
    if payload.description is not None:
        segment.description = payload.description
    if payload.filters is not None:
        segment.filters = json.dumps(payload.filters)
    db.commit()
    db.refresh(segment)
    return _to_out(db, user, segment)


@router.delete("/{segment_id}", response_model=Message)
def delete_segment(segment_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    segment = _owned(db, segment_id, user)
    db.delete(segment)
    db.commit()
    log_activity(db, user_id=user.id, action="segment_deleted", entity="segment", entity_id=segment_id)
    return Message(detail="Segment deleted")


@router.get("/{segment_id}/preview", response_model=SegmentPreview)
def preview_segment(segment_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    segment = _owned(db, segment_id, user)
    filters = _filters(segment)
    count = count_audience(db, user, segment_ids=[segment.id])
    base = select(Contact).where(Contact.owner_id == user.id, Contact.status.notin_(EXCLUDED_STATUSES))
    stmt = apply_contact_filters(base, filters).limit(5)
    sample = db.execute(stmt).scalars().all()
    return SegmentPreview(count=count, sample=sample)


def _owned(db: Session, segment_id: int, user: User) -> Segment:
    segment = db.get(Segment, segment_id)
    if not segment or segment.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Segment not found")
    return segment
