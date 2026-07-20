"""Pluggable file storage. Local disk by default; swap in S3 by implementing Storage."""
from __future__ import annotations

import os
import shutil
import uuid
from pathlib import Path
from typing import BinaryIO

from app.core.config import settings


class Storage:
    def save(self, file: BinaryIO, original_name: str, folder: str = "General") -> tuple[str, str, int]:
        raise NotImplementedError

    def delete(self, filename: str) -> None:
        raise NotImplementedError

    def url_for(self, filename: str) -> str:
        raise NotImplementedError


class LocalStorage(Storage):
    def __init__(self, root: str | None = None):
        self.root = Path(root or settings.MEDIA_ROOT)
        self.root.mkdir(parents=True, exist_ok=True)

    def save(self, file: BinaryIO, original_name: str, folder: str = "General") -> tuple[str, str, int]:
        ext = Path(original_name).suffix
        stored = f"{uuid.uuid4().hex}{ext}"
        dest = self.root / stored
        with open(dest, "wb") as out:
            shutil.copyfileobj(file, out)
        size = os.path.getsize(dest)
        return stored, self.url_for(stored), size

    def delete(self, filename: str) -> None:
        path = self.root / filename
        if path.exists():
            path.unlink()

    def url_for(self, filename: str) -> str:
        return f"/media/{filename}"


def get_storage() -> Storage:
    # Extend here for S3: `if settings.STORAGE_BACKEND == "s3": return S3Storage()`
    return LocalStorage()
