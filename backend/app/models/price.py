"""
Modelo: SupplierPrice.

Preço de um produto num fornecedor, com data de validade.
Suporta o motor de comparação que escolhe o melhor preço por item.
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    String, Boolean, Enum as SAEnum, ForeignKey, Numeric, DateTime, Integer,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class PriceSource(str, enum.Enum):
    MANUAL = "manual"
    IMPORT = "import"
    OCR = "ocr"


class SupplierPrice(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "supplier_prices"

    supplier_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("suppliers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    price: Mapped[float] = mapped_column(Numeric(12, 4), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="EUR", nullable=False)
    # preço por unidade base (ex: €/kg) — para comparação justa entre embalagens
    unit_price: Mapped[float] = mapped_column(Numeric(12, 6), nullable=False, index=True)
    package_qty: Mapped[float] = mapped_column(default=1, nullable=False)
    min_order_qty: Mapped[float] = mapped_column(default=1, nullable=False)
    valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    valid_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    source: Mapped[PriceSource] = mapped_column(
        SAEnum(
            PriceSource,
            name="price_source",
            values_callable=lambda x: [e.value for e in x],
        ),
        default=PriceSource.MANUAL,
        nullable=False,
    )
    # linha de origem (debug / auditoria)
    source_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_current: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    notes: Mapped[str | None] = mapped_column(String(255), nullable=True)

    supplier: Mapped["Supplier"] = relationship(back_populates="prices")  # noqa: F821
    product: Mapped["Product"] = relationship(back_populates="prices")  # noqa: F821

    def __repr__(self) -> str:  # pragma: no cover
        return f"<SupplierPrice {self.product_id}@{self.supplier_id} = {self.price}>"
