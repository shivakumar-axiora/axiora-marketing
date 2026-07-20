"""Contact, group & segment schemas."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ContactStatus


class GroupBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = ""
    color: str = "#25D366"


class GroupCreate(GroupBase):
    pass


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None


class GroupOut(GroupBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    contact_count: int = 0
    created_at: datetime


class ContactBase(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    phone: str = Field(min_length=5, max_length=30)
    country_code: Optional[str] = ""
    email: Optional[str] = ""
    company: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    tags: Optional[str] = ""
    notes: Optional[str] = ""
    status: ContactStatus = ContactStatus.ACTIVE


class ContactCreate(ContactBase):
    group_ids: List[int] = []


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    country_code: Optional[str] = None
    email: Optional[str] = None
    company: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    tags: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[ContactStatus] = None
    group_ids: Optional[List[int]] = None


class ContactOut(ContactBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    groups: List[GroupOut] = []
    created_at: datetime


class SegmentBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = ""
    filters: Dict[str, Any] = {}


class SegmentCreate(SegmentBase):
    pass


class SegmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None


class SegmentOut(SegmentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    matching_count: int = 0
    created_at: datetime


class SegmentPreview(BaseModel):
    count: int
    sample: List[ContactOut] = []


class BulkContactUpdate(BaseModel):
    ids: List[int]
    status: Optional[ContactStatus] = None
    add_group_ids: List[int] = []
    remove_group_ids: List[int] = []
    add_tags: Optional[str] = None


class ImportResult(BaseModel):
    imported: int
    duplicates: int
    invalid: int
    errors: List[str] = []
