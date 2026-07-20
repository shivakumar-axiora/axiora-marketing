"""Group CRUD."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.contact import Group
from app.models.user import User
from app.schemas.common import Message
from app.schemas.contact import GroupCreate, GroupOut, GroupUpdate
from app.services.activity import log_activity

router = APIRouter(prefix="/groups", tags=["groups"])


def _to_out(g: Group) -> GroupOut:
    return GroupOut(
        id=g.id, name=g.name, description=g.description or "", color=g.color,
        contact_count=len(g.contacts), created_at=g.created_at,
    )


@router.get("", response_model=list[GroupOut])
def list_groups(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    groups = db.execute(
        select(Group).where(Group.owner_id == user.id).order_by(Group.name)
    ).scalars().all()
    return [_to_out(g) for g in groups]


@router.post("", response_model=GroupOut, status_code=201)
def create_group(payload: GroupCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    exists = db.execute(
        select(Group).where(Group.owner_id == user.id, Group.name == payload.name)
    ).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=400, detail="A group with this name already exists")
    group = Group(**payload.model_dump(), owner_id=user.id)
    db.add(group)
    db.commit()
    db.refresh(group)
    log_activity(db, user_id=user.id, action="group_created", entity="group", entity_id=group.id)
    return _to_out(group)


@router.put("/{group_id}", response_model=GroupOut)
def update_group(group_id: int, payload: GroupUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    group = db.get(Group, group_id)
    if not group or group.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Group not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(group, field, value)
    db.commit()
    db.refresh(group)
    return _to_out(group)


@router.delete("/{group_id}", response_model=Message)
def delete_group(group_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    group = db.get(Group, group_id)
    if not group or group.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Group not found")
    db.delete(group)
    db.commit()
    log_activity(db, user_id=user.id, action="group_deleted", entity="group", entity_id=group_id)
    return Message(detail="Group deleted")
