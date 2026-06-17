"""
Modelo: PurchaseOrder + PurchaseOrderItem.

Um PurchaseOrder é o resultado de dividir um pedido livre pelos fornecedores
com menor custo (split-by-supplier).
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    String, Boolean, Enum as SAEnum, ForeignKey, Numeric, Integer, Text, DateTime,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class OrderStatus(str, enum.Enum):
    DRAFT = "draft"               # gerado, ainda não enviado
    COPIED = "copied"             # utilizador copiou para enviar
    PLACED = "placed"             # marcado como "pedido realizado"
    CANCELLED = "cancelled"


class PurchaseOrder(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "purchase_orders"

    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    status: Mapped[OrderStatus] = mapped_column(
        SAEnum(
            OrderStatus,
            name="order_status",
            values_callable=lambda x: [e.value for e in x],
        ),
        default=OrderStatus.DRAFT,
        nullable=False,
        index=True,
    )
    # Texto original do utilizador (audit + melhoria de IA)
    raw_input: Mapped[str | None] = mapped_column(Text, nullable=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False, index=True
    )
    supplier_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("suppliers.id", ondelete="RESTRICT"),
        nullable=False, index=True
    )
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="EUR", nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    placed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expected_delivery: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    items: Mapped[list["PurchaseOrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", lazy="selectin"
    )
    user: Mapped["User"] = relationship()  # noqa: F821
    supplier: Mapped["Supplier"] = relationship()  # noqa: F821

    def __repr__(self) -> str:  # pragma: no cover
        return f"<PurchaseOrder {self.code} {self.status.value} total={self.total_amount}>"


class PurchaseOrderItem(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "purchase_order_items"

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("purchase_orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    supplier_price_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("supplier_prices.id", ondelete="SET NULL"),
        nullable=True,
    )
    # Texto original do item, ex: "10 caixas coca cola"
    raw_line: Mapped[str | None] = mapped_column(String(255), nullable=True)
    quantity: Mapped[float] = mapped_column(Numeric(12, 3), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(12, 4), nullable=False)
    line_total: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    is_substitution: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    substitution_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)

    order: Mapped[PurchaseOrder] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship()  # noqa: F821
    supplier_price: Mapped["SupplierPrice | None"] = relationship()  # noqa: F821

    def __repr__(self) -> str:  # pragma: no cover
        return f"<POItem {self.product_id} qty={self.quantity} total={self.line_total}>"
