"""Schemas de Importação (upload + revisão)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import Field

from app.schemas.common import ORMBase


class ExtractedRow(ORMBase):
    """Linha bruta extraída pelo OCR."""

    row_index: int
    raw_text: str
    cells: list[str | None] = []
    confidence: float = 1.0


class NormalizedRow(ORMBase):
    """Linha normalizada pela IA, pronta para revisão."""

    row_index: int
    raw_text: str
    suggested_name: str | None = None
    brand: str | None = None
    quantity: float | None = None
    unit: str | None = None
    package_size: float | None = None
    package_unit: str | None = None
    price: float | None = None
    currency: str = "EUR"
    ean: str | None = None
    confidence: float = 0.0
    product_id: UUID | None = None  # match existente (opcional)
    action: str = "review"  # approve | edit | ignore


class ImportOut(ORMBase):
    id: UUID
    supplier_id: UUID | None
    import_type: str
    original_filename: str
    mime_type: str | None
    size_bytes: int
    status: str
    rows_total: int
    rows_approved: int
    rows_rejected: int
    created_at: datetime
    approved_at: datetime | None
    error_message: str | None
    extracted_rows: list[ExtractedRow] = []
    normalized_rows: list[NormalizedRow] = []


class ReviewDecision(ORMBase):
    row_index: int
    action: str  # approve | ignore
    # Edição opcional (caso o admin corrija)
    suggested_name: str | None = None
    brand: str | None = None
    quantity: float | None = None
    unit: str | None = None
    package_size: float | None = None
    package_unit: str | None = None
    price: float | None = None
    currency: str | None = None
    ean: str | None = None
    product_id: UUID | None = None  # se escolher produto existente


class ReviewSubmit(ORMBase):
    decisions: list[ReviewDecision] = Field(default_factory=list)
    default_supplier_id: UUID | None = None
