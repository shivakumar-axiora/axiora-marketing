"""Reusable schema helpers."""
from typing import Generic, List, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int


class Message(BaseModel):
    detail: str


class IDList(BaseModel):
    ids: List[int]
