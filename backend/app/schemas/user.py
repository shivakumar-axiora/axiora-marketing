"""User & role schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import RoleName


class RoleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str] = ""


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = ""


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)
    role: RoleName = RoleName.EXECUTIVE
    is_active: bool = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[RoleName] = None
    is_active: Optional[bool] = None
    avatar_url: Optional[str] = None


class ProfileUpdate(BaseModel):
    """Fields a user may edit on their own profile."""
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    phone: Optional[str] = Field(default=None, max_length=30)


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str] = ""
    role: RoleOut
    created_at: datetime
