"""Aggregate all v1 routers."""
from fastapi import APIRouter

from app.api.v1 import (
    auth,
    campaigns,
    contacts,
    dashboard,
    groups,
    health,
    logs,
    media,
    notifications,
    reports,
    search,
    segments,
    settings,
    templates,
    users,
    webhooks,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(contacts.router)
api_router.include_router(groups.router)
api_router.include_router(segments.router)
api_router.include_router(campaigns.router)
api_router.include_router(templates.router)
api_router.include_router(media.router)
api_router.include_router(settings.router)
api_router.include_router(dashboard.router)
api_router.include_router(reports.router)
api_router.include_router(notifications.router)
api_router.include_router(logs.router)
api_router.include_router(search.router)
api_router.include_router(webhooks.router)
