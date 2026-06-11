"""Schemas de Order + Parsing livre (IA)."""

from __future__ import annotations

from uuid import UUID

from pydantic import Field

from app.schemas.common import ORMBase


# ---------- Parsing livre (entrada do utilizador) ----------


class FreeTextItemIn(ORMBase):
    """Linha já estruturada (saída da IA)."""

    raw_line: str
    product_name: str | None = None
    product_id: UUID | None = None
    quantity: float = Field(gt=0)
    unit: str = "un"
    brand: str | None = None
    notes: str | None = None


class FreeTextParseRequest(ORMBase):
    text: str = Field(min_length=1, max_length=10_000)
    locale: str = "pt-PT"


class FreeTextParseResponse(ORMBase):
    items: list[FreeTextItemIn]
    ambiguous: list[FreeTextItemIn] = []  # itens sem match óbvio


class OrderOptimizeRequest(ORMBase):
    items: list[FreeTextItemIn]
    locale: str = "pt-PT"


# ---------- Resultado da otimização ----------


class OptimizedItem(ORMBase):
    raw_line: str
    product_id: UUID
    product_name: str
    quantity: float
    unit: str
    supplier_id: UUID
    supplier_name: str
    unit_price: float
    line_total: float
    is_substitution: bool = False
    substitution_reason: str | None = None
    alternatives: list["OptimizedItem"] = []


class OptimizedSupplierGroup(ORMBase):
    supplier_id: UUID
    supplier_name: str
    items: list[OptimizedItem]
    total: float
    item_count: int


class OrderOptimizeResponse(ORMBase):
    groups: list[OptimizedSupplierGroup]
    grand_total: float
    unmatchable: list[FreeTextItemIn] = []


# ---------- Purchase Order persistido ----------


class PurchaseOrderItemOut(ORMBase):
    id: UUID
    product_id: UUID
    product_name: str
    raw_line: str | None
    quantity: float
    unit_price: float
    line_total: float
    is_substitution: bool
    substitution_reason: str | None


class PurchaseOrderOut(ORMBase):
    id: UUID
    code: str
    status: str
    supplier_id: UUID
    supplier_name: str
    user_id: UUID
    total_amount: float
    currency: str
    raw_input: str | None
    notes: str | None
    placed_at: str | None
    items: list[PurchaseOrderItemOut]


class PurchaseOrderUpdate(ORMBase):
    status: str | None = None
    notes: str | None = None


OptimizedItem.model_rebuild()
