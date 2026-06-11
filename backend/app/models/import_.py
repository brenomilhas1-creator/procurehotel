"""
Modelo: Import.

Regista cada upload de PDF/Excel/imagem feito pelo ADMIN.
Guarda:
  - estado do processamento (uploaded -> ocr_done -> normalized -> approved)
  - caminho do ficheiro original
  - JSON com linhas extraídas e linhas normalizadas (rascunho de revisão)
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    String, Boolean, Enum as SAEnum, ForeignKey, Integer, Text, DateTime, BigInteger,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class ImportStatus(str, enum.Enum):
    UPLOADED = "uploaded"        # ficheiro guardado
    OCR_DONE = "ocr_done"        # texto/tabelas extraídos
    NORMALIZED = "normalized"    # IA devolveu mapeamento produto↔linha
    REVIEWING = "reviewing"      # admin a rever
    APPROVED = "approved"        # admin aprovou -> atualizou supplier_prices
    REJECTED = "rejected"        # admin rejeitou
    FAILED = "failed"            # erro técnico


class ImportType(str, enum.Enum):
    PRICE_LIST = "price_list"
    INVOICE = "invoice"


class ImportRecord(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "imports"

    supplier_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("suppliers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    import_type: Mapped[ImportType] = mapped_column(
        SAEnum(
            ImportType,
            name="import_type",
            values_callable=lambda x: [e.value for e in x],
        ),
        default=ImportType.PRICE_LIST,
        nullable=False,
    )
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_path: Mapped[str] = mapped_column(String(512), nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    size_bytes: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    status: Mapped[ImportStatus] = mapped_column(
        SAEnum(
            ImportStatus,
            name="import_status",
            values_callable=lambda x: [e.value for e in x],
        ),
        default=ImportStatus.UPLOADED,
        nullable=False,
        index=True,
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Resultados intermédios (rascunho de revisão)
    extracted_rows: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    # rows normalizadas pela IA: [{raw, suggested_name, brand, qty, unit, package,
    #                               price, currency, ean, confidence, product_id, action}]
    normalized_rows: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # Estatísticas
    rows_total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rows_approved: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rows_rejected: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship()  # noqa: F821
    supplier: Mapped["Supplier | None"] = relationship()  # noqa: F821

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Import {self.original_filename} status={self.status.value}>"
