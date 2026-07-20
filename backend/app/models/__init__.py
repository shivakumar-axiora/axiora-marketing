"""Import all models so that Base.metadata is fully populated."""
from app.models.campaign import Campaign, CampaignLog, CampaignRecipient
from app.models.contact import Contact, Group, Segment, group_contacts
from app.models.media import Media
from app.models.system import ActivityLog, EmailSetting, Notification, Setting, WebhookLog
from app.models.template import Template
from app.models.user import Role, User

__all__ = [
    "Role",
    "User",
    "Contact",
    "Group",
    "Segment",
    "group_contacts",
    "Campaign",
    "CampaignRecipient",
    "CampaignLog",
    "Template",
    "Media",
    "Setting",
    "EmailSetting",
    "Notification",
    "ActivityLog",
    "WebhookLog",
]
