"""Schemas comuns partilhados."""

from __future__ import annotations

from datetime import datetime
from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)


class IdResponse(ORMBase):
    id: UUID


class Timestamps(ORMBase):
    created_at: datetime
    updated_at: datetime


class Page(BaseModel, Generic[T]):
    """Resposta paginada genérica."""

    items: list[T]
    total: int
    page: int
    size: int
    pages: int


class Message(ORMBase):
    message: str
