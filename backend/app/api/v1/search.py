"""Global search across contacts, campaigns, templates, groups."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.campaign import Campaign
from app.models.contact import Contact, Group
from app.models.template import Template
from app.models.user import User

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
def global_search(q: str = Query(min_length=1), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    like = f"%{q}%"
    contacts = db.execute(
        select(Contact).where(Contact.owner_id == user.id,
                              (Contact.name.ilike(like)) | (Contact.phone.ilike(like))).limit(5)
    ).scalars().all()
    campaigns = db.execute(
        select(Campaign).where(Campaign.owner_id == user.id, Campaign.name.ilike(like)).limit(5)
    ).scalars().all()
    templates = db.execute(
        select(Template).where(Template.owner_id == user.id, Template.name.ilike(like)).limit(5)
    ).scalars().all()
    groups = db.execute(
        select(Group).where(Group.owner_id == user.id, Group.name.ilike(like)).limit(5)
    ).scalars().all()
    return {
        "contacts": [{"id": c.id, "label": c.name, "sub": c.phone} for c in contacts],
        "campaigns": [{"id": c.id, "label": c.name, "sub": c.status.value} for c in campaigns],
        "templates": [{"id": t.id, "label": t.name, "sub": t.category.value} for t in templates],
        "groups": [{"id": g.id, "label": g.name, "sub": f"{len(g.contacts)} contacts"} for g in groups],
    }
