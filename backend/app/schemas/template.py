"""Template & media schemas."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import Channel, MediaType, TemplateCategory, TemplateStatus


class TemplateBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    channel: Channel = Channel.WHATSAPP
    language: str = "en_US"
    category: TemplateCategory = TemplateCategory.MARKETING
    subject: Optional[str] = ""
    html_body: Optional[str] = ""
    body: str = ""
    header: Optional[str] = ""
    footer: Optional[str] = ""
    example_variables: Optional[str] = ""


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    language: Optional[str] = None
    category: Optional[TemplateCategory] = None
    subject: Optional[str] = None
    html_body: Optional[str] = None
    body: Optional[str] = None
    header: Optional[str] = None
    footer: Optional[str] = None
    is_favorite: Optional[bool] = None
    example_variables: Optional[str] = None


class TemplateOut(TemplateBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: TemplateStatus
    is_favorite: bool
    wa_template_id: Optional[str] = ""
    header_type: Optional[str] = ""
    created_at: datetime


class MediaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    filename: str
    original_name: str
    folder: str
    media_type: MediaType
    mime_type: str
    size_bytes: int
    url: str
    created_at: datetime


class MediaRename(BaseModel):
    original_name: str
    folder: Optional[str] = None
