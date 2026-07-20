"""Pluggable file storage. Local disk by default; S3-compatible backend for serverless hosts."""
from __future__ import annotations

import os
import shutil
import uuid
from pathlib import Path
from typing import BinaryIO
from urllib.parse import quote

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


class S3Storage(Storage):
    """S3-compatible storage. Works with AWS S3, Cloudflare R2, Supabase Storage, MinIO, etc."""

    def __init__(self):
        import boto3
        from botocore.config import Config

        if not settings.S3_BUCKET:
            raise RuntimeError("S3_BUCKET must be set when STORAGE_BACKEND=s3")

        self.bucket = settings.S3_BUCKET
        self.client = boto3.client(
            "s3",
            region_name=settings.S3_REGION,
            aws_access_key_id=settings.S3_ACCESS_KEY_ID or None,
            aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY or None,
            endpoint_url=settings.S3_ENDPOINT_URL or None,
            config=Config(s3={"addressing_style": "path" if settings.S3_USE_PATH_STYLE else "auto"}),
        )

    def save(self, file: BinaryIO, original_name: str, folder: str = "General") -> tuple[str, str, int]:
        ext = Path(original_name).suffix
        stored = f"{uuid.uuid4().hex}{ext}"
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        self.client.upload_fileobj(file, self.bucket, stored)
        return stored, self.url_for(stored), size

    def delete(self, filename: str) -> None:
        self.client.delete_object(Bucket=self.bucket, Key=filename)

    def url_for(self, filename: str) -> str:
        key = quote(filename)
        if settings.S3_PUBLIC_URL_BASE:
            return f"{settings.S3_PUBLIC_URL_BASE.rstrip('/')}/{key}"
        if settings.S3_ENDPOINT_URL:
            if settings.S3_USE_PATH_STYLE:
                return f"{settings.S3_ENDPOINT_URL.rstrip('/')}/{self.bucket}/{key}"
            return f"{settings.S3_ENDPOINT_URL.rstrip('/')}/{key}"
        return f"https://{self.bucket}.s3.{settings.S3_REGION}.amazonaws.com/{key}"


def get_storage() -> Storage:
    if settings.STORAGE_BACKEND == "s3":
        return S3Storage()
    return LocalStorage()
