"""Campaign schemas."""
import json
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import CampaignStatus, Channel, MessageStatus, ScheduleType


class CampaignBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = ""
    channel: Channel = Channel.WHATSAPP
    subject: Optional[str] = ""
    message_body: Optional[str] = ""
    schedule_type: ScheduleType = ScheduleType.IMMEDIATE
    scheduled_at: Optional[datetime] = None
    timezone: str = "UTC"
    template_id: Optional[int] = None
    media_id: Optional[int] = None
    template_variables: Optional[Dict[str, str]] = None


class CampaignCreate(CampaignBase):
    group_ids: List[int] = []
    segment_ids: List[int] = []
    contact_ids: List[int] = []
    all_contacts: bool = False


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    channel: Optional[Channel] = None
    subject: Optional[str] = None
    message_body: Optional[str] = None
    schedule_type: Optional[ScheduleType] = None
    scheduled_at: Optional[datetime] = None
    timezone: Optional[str] = None
    template_id: Optional[int] = None
    media_id: Optional[int] = None
    template_variables: Optional[Dict[str, str]] = None
    group_ids: Optional[List[int]] = None
    segment_ids: Optional[List[int]] = None
    contact_ids: Optional[List[int]] = None
    all_contacts: Optional[bool] = None


class CampaignOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str] = ""
    channel: Channel
    subject: Optional[str] = ""
    message_body: Optional[str] = ""
    status: CampaignStatus
    schedule_type: ScheduleType
    scheduled_at: Optional[datetime] = None
    timezone: str
    template_id: Optional[int] = None
    media_id: Optional[int] = None
    template_variables: Optional[Dict[str, str]] = None
    total_recipients: int
    sent_count: int
    delivered_count: int
    read_count: int
    failed_count: int
    created_at: datetime
    updated_at: datetime

    @field_validator("template_variables", mode="before")
    @classmethod
    def _parse_template_variables(cls, v):
        if isinstance(v, str):
            if not v:
                return None
            try:
                return json.loads(v)
            except (ValueError, TypeError):
                return None
        return v


class RecipientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    contact_id: int
    phone: Optional[str] = None
    email: Optional[str] = None
    rendered_subject: Optional[str] = ""
    rendered_message: Optional[str] = ""
    status: MessageStatus
    error_code: Optional[str] = ""
    error_message: Optional[str] = ""
    retries: int
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None


class CampaignPreview(BaseModel):
    recipient_count: int
    sample_messages: List[str]
    sample_subjects: List[str] = []
    estimated_seconds: int


class CampaignLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    level: str
    event: str
    message: Optional[str] = ""
    created_at: datetime
