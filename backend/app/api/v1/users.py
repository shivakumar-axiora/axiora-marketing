"""User management (Admin only)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.security import hash_password
from app.db.session import get_db
from app.models.user import Role, User
from app.schemas.common import Message
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.services.activity import log_activity

router = APIRouter(prefix="/users", tags=["users"])


def _role(db: Session, name: str) -> Role:
    role = db.execute(select(Role).where(Role.name == name)).scalar_one_or_none()
    if not role:
        role = Role(name=name, description=name)
        db.add(role)
        db.flush()
    return role


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.execute(select(User).order_by(User.created_at.desc())).scalars().all()


@router.post("", response_model=UserOut, status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    role = _role(db, payload.role.value)
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone or "",
        hashed_password=hash_password(payload.password),
        role_id=role.id,
        is_active=payload.is_active,
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    log_activity(db, user_id=admin.id, action="user_created", entity="user", entity_id=user.id)
    return user


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    data = payload.model_dump(exclude_unset=True)
    if "role" in data and data["role"] is not None:
        user.role_id = _role(db, data.pop("role").value).id
    for field, value in data.items():
        if value is not None:
            setattr(user, field, value)
    db.commit()
    db.refresh(user)
    log_activity(db, user_id=admin.id, action="user_updated", entity="user", entity_id=user.id)
    return user


@router.delete("/{user_id}", response_model=Message)
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    log_activity(db, user_id=admin.id, action="user_deleted", entity="user", entity_id=user_id)
    return Message(detail="User deleted")
