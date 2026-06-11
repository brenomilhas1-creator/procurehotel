"""Schemas de Supplier e SupplierPrice."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import Field, EmailStr

from app.schemas.common import ORMBase


class SupplierCreate(ORMBase):
    name: str = Field(min_length=2, max_length=255)
    tax_id: str | None = None
    contact_name: str | None = None
    contact_email: EmailStr | None = None
    contact_phone: str | None = None
    address: str | None = None
    website: str | None = None
    notes: str | None = None
    payment_terms: str | None = None
    delivery_lead_time_hours: int | None = None
    minimum_order: float | None = None
    is_preferred: bool = False


class SupplierUpdate(ORMBase):
    name: str | None = None
    tax_id: str | None = None
    contact_name: str | None = None
    contact_email: EmailStr | None = None
    contact_phone: str | None = None
    address: str | None = None
    website: str | None = None
    notes: str | None = None
    payment_terms: str | None = None
    delivery_lead_time_hours: int | None = None
    minimum_order: float | None = None
    is_preferred: bool | None = None
    is_active: bool | None = None


class SupplierOut(ORMBase):
    id: UUID
    name: str
    tax_id: str | None
    contact_name: str | None
    contact_email: str | None
    contact_phone: str | None
    address: str | None
    website: str | None
    notes: str | None
    payment_terms: str | None
    delivery_lead_time_hours: int | None
    minimum_order: float | None
    is_preferred: bool
    is_active: bool


class SupplierPriceCreate(ORMBase):
    supplier_id: UUID
    product_id: UUID
    price: float = Field(gt=0)
    currency: str = "EUR"
    package_qty: float = 1
    min_order_qty: float = 1
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    source: str = "manual"
    notes: str | None = None


class SupplierPriceOut(ORMBase):
    id: UUID
    supplier_id: UUID
    product_id: UUID
    price: float
    currency: str
    unit_price: float
    package_qty: float
    min_order_qty: float
    valid_from: datetime | None
    valid_until: datetime | None
    source: str
    is_current: bool
