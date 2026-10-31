"""Media library: upload, list, rename, delete."""
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import distinct, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.campaign import Campaign
from app.models.enums import MediaType
from app.models.media import Media
from app.models.user import User
from app.schemas.common import Message
from app.schemas.template import MediaOut, MediaRename
from app.services.activity import log_activity
from app.services.storage import get_storage

router = APIRouter(prefix="/media", tags=["media"])

_TYPE_MAP = {
    "image": MediaType.IMAGE, "video": MediaType.VIDEO,
    "audio": MediaType.AUDIO, "application": MediaType.DOCUMENT, "text": MediaType.DOCUMENT,
}


def _detect_type(mime: str) -> MediaType:
    return _TYPE_MAP.get((mime or "").split("/")[0], MediaType.DOCUMENT)


@router.get("", response_model=list[MediaOut])
def list_media(
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
    folder: Optional[str] = None, search: Optional[str] = None,
):
    stmt = select(Media).where(Media.owner_id == user.id)
    if folder:
        stmt = stmt.where(Media.folder == folder)
    if search:
        stmt = stmt.where(Media.original_name.ilike(f"%{search}%"))
    return db.execute(stmt.order_by(Media.created_at.desc())).scalars().all()


@router.get("/folders", response_model=list[str])
def list_folders(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.execute(select(distinct(Media.folder)).where(Media.owner_id == user.id)).scalars().all()
    return sorted(set(rows) | {"General"})


@router.post("/upload", response_model=MediaOut, status_code=201)
async def upload_media(
    file: UploadFile = File(...), folder: str = Form("General"),
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
):
    storage = get_storage()
    stored, url, size = storage.save(file.file, file.filename or "file", folder)
    media = Media(
        filename=stored, original_name=file.filename or stored, folder=folder or "General",
        media_type=_detect_type(file.content_type or ""), mime_type=file.content_type or "",
        size_bytes=size, url=url, owner_id=user.id,
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    log_activity(db, user_id=user.id, action="media_uploaded", entity="media", entity_id=media.id)
    return media


@router.put("/{media_id}", response_model=MediaOut)
def rename_media(media_id: int, payload: MediaRename, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    media = _owned(db, media_id, user)
    media.original_name = payload.original_name
    if payload.folder:
        media.folder = payload.folder
    db.commit()
    db.refresh(media)
    return media


@router.delete("/{media_id}", response_model=Message)
def delete_media(media_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    media = _owned(db, media_id, user)
    using_campaigns = db.execute(
        select(Campaign.name).where(Campaign.media_id == media_id)
    ).scalars().all()
    if using_campaigns:
        names = ", ".join(using_campaigns[:3]) + (f" and {len(using_campaigns) - 3} more" if len(using_campaigns) > 3 else "")
        raise HTTPException(
            status_code=400,
            detail=f"Can't delete — still attached to campaign(s): {names}. Remove it from those campaigns first.",
        )
    get_storage().delete(media.filename)
    db.delete(media)
    db.commit()
    return Message(detail="Media deleted")


def _owned(db: Session, media_id: int, user: User) -> Media:
    media = db.get(Media, media_id)
    if not media or media.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Media not found")
    return media
