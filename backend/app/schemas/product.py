"""Schemas de Product + Alias."""

from __future__ import annotations

from uuid import UUID

from pydantic import Field

from app.schemas.common import ORMBase


class ProductAliasIn(ORMBase):
    alias: str = Field(min_length=1, max_length=255)
    locale: str = "pt-PT"


class ProductAliasOut(ORMBase):
    id: UUID
    alias: str
    locale: str
    hit_count: int


class ProductCreate(ORMBase):
    master_name: str = Field(min_length=2, max_length=255)
    brand: str | None = None
    category: str | None = None
    unit: str = "un"
    package_size: float | None = None
    package_unit: str | None = None
    substitution_allowed: bool = True
    description: str | None = None
    sku: str | None = None
    ean: str | None = None
    aliases: list[ProductAliasIn] = []


class ProductUpdate(ORMBase):
    master_name: str | None = None
    brand: str | None = None
    category: str | None = None
    unit: str | None = None
    package_size: float | None = None
    package_unit: str | None = None
    status: str | None = None
    substitution_allowed: bool | None = None
    description: str | None = None
    sku: str | None = None
    ean: str | None = None


class ProductOut(ORMBase):
    id: UUID
    master_name: str
    brand: str | None
    category: str | None
    unit: str
    package_size: float | None
    package_unit: str | None
    status: str
    substitution_allowed: bool
    description: str | None
    sku: str | None
    ean: str | None
    is_active: bool
    aliases: list[ProductAliasOut] = []
