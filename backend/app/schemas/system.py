"""Settings, notifications, logs, dashboard schemas."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class SettingUpdate(BaseModel):
    business_account_id: Optional[str] = None
    phone_number_id: Optional[str] = None
    access_token: Optional[str] = None       # plaintext in; encrypted at rest
    app_secret: Optional[str] = None
    webhook_verify_token: Optional[str] = None
    send_rate_per_second: Optional[int] = None
    batch_size: Optional[int] = None
    default_timezone: Optional[str] = None


class SettingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    business_account_id: Optional[str] = ""
    phone_number_id: Optional[str] = ""
    access_token_masked: Optional[str] = ""
    app_secret_masked: Optional[str] = ""
    webhook_verify_token: Optional[str] = ""
    is_connected: bool = False
    send_rate_per_second: int = 10
    batch_size: int = 25
    default_timezone: str = "UTC"


class EmailSettingUpdate(BaseModel):
    resend_api_key: Optional[str] = None    # plaintext in; encrypted at rest
    from_email: Optional[str] = None
    from_name: Optional[str] = None
    send_rate_per_second: Optional[int] = None
    batch_size: Optional[int] = None


class EmailSettingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    from_email: Optional[str] = ""
    from_name: Optional[str] = ""
    resend_api_key_masked: Optional[str] = ""
    is_connected: bool = False
    send_rate_per_second: int = 2
    batch_size: int = 25


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    body: Optional[str] = ""
    type: str
    is_read: bool
    link: Optional[str] = ""
    created_at: datetime


class ActivityLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: Optional[int] = None
    action: str
    entity: Optional[str] = ""
    entity_id: Optional[str] = ""
    detail: Optional[str] = ""
    created_at: datetime


class WebhookLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    event_type: str
    processed: bool
    payload: str
    created_at: datetime


class DashboardStats(BaseModel):
    total_contacts: int
    total_campaigns: int
    active_campaigns: int
    scheduled_campaigns: int
    messages_sent: int
    messages_delivered: int
    messages_read: int
    failed_messages: int
    pending_messages: int
    success_rate: float
    delivery_rate: float
    todays_campaigns: int


class TimeSeriesPoint(BaseModel):
    label: str
    value: int


class DashboardCharts(BaseModel):
    daily_messages: List[TimeSeriesPoint]
    weekly_campaigns: List[TimeSeriesPoint]
    delivery_stats: List[TimeSeriesPoint]
    campaign_performance: List[TimeSeriesPoint]
