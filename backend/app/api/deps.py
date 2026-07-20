"""Shared FastAPI dependencies: authentication and role-based access control."""
from typing import Iterable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_token
from app.db.session import get_db
from app.models.enums import RoleName
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")

CREDENTIALS_EXC = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise CREDENTIALS_EXC
    user_id = payload.get("sub")
    if user_id is None:
        raise CREDENTIALS_EXC
    user = db.get(User, int(user_id))
    if not user:
        raise CREDENTIALS_EXC
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return user


def get_current_active_user(user: User = Depends(get_current_user)) -> User:
    return user


class RoleChecker:
    """Dependency factory enforcing that the current user has one of the allowed roles."""

    def __init__(self, allowed: Iterable[RoleName]):
        self.allowed = {r.value for r in allowed}

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.role.name not in self.allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return user


require_admin = RoleChecker([RoleName.ADMIN])
require_manager = RoleChecker([RoleName.ADMIN, RoleName.MARKETING_MANAGER])
# Executives can operate day-to-day (any authenticated active user).
