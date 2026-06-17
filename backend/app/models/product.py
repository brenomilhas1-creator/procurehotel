"""
Modelo: Product + ProductAlias.

Catálogo mestre de produtos. Cada produto tem:
  - nome canónico (master_name)
  - marca
  - categoria
  - unidade base
  - embalagem padrão
  - estado (ativo / oculto / bloqueado)
  - substituição permitida

Os aliases permitem matching flexível:
  "coca", "coca cola", "cc 33" -> Coca Cola Original 33cl
"""

from __future__ import annotations

import enum
import uuid

from sqlalchemy import (
    String, Boolean, Enum as SAEnum, ForeignKey, Integer, Text, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin


class ProductStatus(str, enum.Enum):
    ACTIVE = "active"
    HIDDEN = "hidden"
    BLOCKED = "blocked"


class UnitOfMeasure(str, enum.Enum):
    UNIT = "un"           # unidade
    KG = "kg"             # quilograma
    G = "g"               # grama
    L = "l"               # litro
    ML = "ml"             # mililitro
    BOX = "cx"            # caixa
    PACK = "pc"           # pacote
    BOTTLE = "gf"         # garrafa
    CAN = "lt"            # lata
    BAG = "sc"            # saco
    DOZEN = "dz"          # dúzia


class Product(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "products"

    master_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    brand: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    category: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    unit: Mapped[UnitOfMeasure] = mapped_column(
        SAEnum(
            UnitOfMeasure,
            name="unit_of_measure",
            values_callable=lambda x: [e.value for e in x],
        ),
        default=UnitOfMeasure.UNIT,
        nullable=False,
    )
    package_size: Mapped[float | None] = mapped_column(nullable=True)
    package_unit: Mapped[UnitOfMeasure | None] = mapped_column(
        SAEnum(
            UnitOfMeasure,
            name="unit_of_measure",
            create_type=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=True,
    )
    status: Mapped[ProductStatus] = mapped_column(
        SAEnum(
            ProductStatus,
            name="product_status",
            values_callable=lambda x: [e.value for e in x],
        ),
        default=ProductStatus.ACTIVE,
        nullable=False,
        index=True,
    )
    substitution_allowed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sku: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True, index=True)
    ean: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    substitution_of_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relações
    aliases: Mapped[list["ProductAlias"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    prices: Mapped[list["SupplierPrice"]] = relationship(  # noqa: F821
        back_populates="product",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Product {self.master_name} status={self.status.value}>"


class ProductAlias(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "product_aliases"
    __table_args__ = (
        UniqueConstraint("product_id", "alias", "locale", name="uq_alias_product_alias_locale"),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    alias: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    locale: Mapped[str] = mapped_column(String(8), default="pt-PT", nullable=False)
    hit_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    product: Mapped[Product] = relationship(back_populates="aliases")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<ProductAlias '{self.alias}' -> {self.product_id}>"
