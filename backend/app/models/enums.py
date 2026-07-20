"""Shared enumerations."""
import enum


class RoleName(str, enum.Enum):
    ADMIN = "admin"
    MARKETING_MANAGER = "marketing_manager"
    EXECUTIVE = "executive"


class ContactStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    BLOCKED = "blocked"
    UNSUBSCRIBED = "unsubscribed"


class CampaignStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"
    ARCHIVED = "archived"


class ScheduleType(str, enum.Enum):
    IMMEDIATE = "immediate"
    SCHEDULED = "scheduled"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class MessageStatus(str, enum.Enum):
    PENDING = "pending"
    QUEUED = "queued"
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"
    BOUNCED = "bounced"
    UNSUBSCRIBED = "unsubscribed"
    SPAM_COMPLAINT = "spam_complaint"


class Channel(str, enum.Enum):
    WHATSAPP = "whatsapp"
    EMAIL = "email"


class TemplateCategory(str, enum.Enum):
    MARKETING = "marketing"
    UTILITY = "utility"
    AUTHENTICATION = "authentication"


class TemplateStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class MediaType(str, enum.Enum):
    IMAGE = "image"
    VIDEO = "video"
    DOCUMENT = "document"
    AUDIO = "audio"
