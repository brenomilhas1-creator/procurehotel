"""Importações: upload, OCR, normalização IA, revisão + aprovação."""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AdminUser, CurrentUser, audit
from app.core.config import settings
from app.core.database import get_db
from app.models import (
    AuditAction, ImportRecord, ImportStatus, ImportType, PriceSource,
    Product, ProductAlias, ProductStatus, Supplier, SupplierPrice,
)
from app.schemas.common import Page
from app.schemas.import_ import ImportOut, NormalizedRow, ReviewSubmit
from app.services.ai_normalizer import ai_normalizer
from app.services.ocr_service import extract_rows, save_upload
from app.services.storage import upload_file, download_to_local

router = APIRouter()


@router.post("", response_model=ImportOut, status_code=201)
async def upload_import(
    file: UploadFile = File(...),
    import_type: str = Form("price_list"),
    supplier_id: uuid.UUID | None = Form(None),
    auto_normalize: bool = Form(True),
    db: AsyncSession = None,  # type: ignore
    admin: AdminUser = None,  # type: ignore
):
    if db is None or admin is None:
        raise HTTPException(status_code=500, detail="internal")
    if file.size and file.size > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Ficheiro demasiado grande")

    content = await file.read()
    object_key = await upload_file(
        content=content,
        original_filename=file.filename or "upload",
        mime_type=file.content_type,
        folder="imports",
    )

    rec = ImportRecord(
        supplier_id=supplier_id,
        user_id=admin.id,
        import_type=ImportType(import_type),
        original_filename=file.filename or "file",
        stored_path=object_key,
        mime_type=file.content_type,
        size_bytes=len(content),
        status=ImportStatus.UPLOADED,
    )
    db.add(rec)
    await db.commit()
    await db.refresh(rec)

    # OCR
    try:
        local_path = await download_to_local(object_key)
        rows = await extract_rows(local_path, file.content_type)
        rec.extracted_rows = rows
        rec.rows_total = len(rows)
        rec.status = ImportStatus.OCR_DONE
    except Exception as e:
        rec.status = ImportStatus.FAILED
        rec.error_message = f"OCR: {e}"
        await db.commit()
        await db.refresh(rec)
        raise HTTPException(status_code=422, detail=f"OCR falhou: {e}")

    # IA
    if auto_normalize:
        normalized = await ai_normalizer.normalize_ocr_rows(rows)
        rec.normalized_rows = [n.__dict__ for n in normalized]
        rec.status = ImportStatus.NORMALIZED
    await db.commit()
    await db.refresh(rec)
    return _to_out(rec)


@router.get("", response_model=Page[ImportOut])
async def list_imports(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status_: str | None = Query(None, alias="status"),
):
    base = select(ImportRecord)
    if status_:
        base = base.where(ImportRecord.status == ImportStatus(status_))
    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    rows = (
        await db.execute(
            base.order_by(ImportRecord.created_at.desc())
            .offset((page - 1) * size).limit(size)
        )
    ).scalars().all()
    return Page(
        items=[_to_out(r) for r in rows],
        total=total, page=page, size=size, pages=(total + size - 1) // size,
    )


@router.get("/{import_id}", response_model=ImportOut)
async def get_import(
    import_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
):
    rec = await db.get(ImportRecord, import_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Importação não encontrada")
    return _to_out(rec)


@router.post("/{import_id}/normalize", response_model=ImportOut)
async def renormalize(
    import_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: AdminUser,
):
    rec = await db.get(ImportRecord, import_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Importação não encontrada")
    if not rec.extracted_rows:
        raise HTTPException(status_code=400, detail="Sem linhas extraídas para normalizar")
    normalized = await ai_normalizer.normalize_ocr_rows(rec.extracted_rows)
    rec.normalized_rows = [n.__dict__ for n in normalized]
    rec.status = ImportStatus.NORMALIZED
    await db.commit()
    await db.refresh(rec)
    return _to_out(rec)


@router.post("/{import_id}/review", response_model=ImportOut)
async def submit_review(
    import_id: uuid.UUID,
    body: ReviewSubmit,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: AdminUser,
):
    rec = await db.get(ImportRecord, import_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Importação não encontrada")
    if not rec.normalized_rows:
        raise HTTPException(status_code=400, detail="Sem linhas normalizadas")

    if not rec.supplier_id and not body.default_supplier_id:
        raise HTTPException(status_code=400, detail="Indique supplier_id na importação ou default_supplier_id aqui")
    supplier_id = rec.supplier_id or body.default_supplier_id
    supplier = await db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Fornecedor inválido")

    # Indexar decisões por row_index
    decisions = {d.row_index: d for d in body.decisions}

    approved = 0
    rejected = 0

    for row in rec.normalized_rows:
        idx = row.get("row_index")
        decision = decisions.get(idx)
        action = (decision.action if decision else row.get("action") or "approve").lower()

        if action == "ignore":
            rejected += 1
            continue
        if action not in {"approve", "edit"}:
            rejected += 1
            continue

        # Campos finais (com overrides do admin)
        name = (decision.suggested_name if decision and decision.suggested_name else row.get("suggested_name")) or ""
        brand = decision.brand if decision and decision.brand is not None else row.get("brand")
        qty = decision.quantity if decision and decision.quantity is not None else row.get("quantity") or 1
        unit = (decision.unit if decision and decision.unit else row.get("unit") or "un")
        pkg_size = decision.package_size if decision and decision.package_size is not None else row.get("package_size")
        pkg_unit = decision.package_unit if decision and decision.package_unit else row.get("package_unit")
        price = decision.price if decision and decision.price is not None else row.get("price")
        ean = decision.ean if decision and decision.ean is not None else row.get("ean")
        product_id_override = decision.product_id if decision else None

        if not name or price is None:
            rejected += 1
            continue

        # 1) Resolver / criar produto
        product = None
        if product_id_override:
            product = await db.get(Product, product_id_override)
        if not product:
            product = Product(
                master_name=name,
                brand=brand,
                unit=unit,
                package_size=pkg_size,
                package_unit=pkg_unit,
                ean=ean,
                status=ProductStatus.ACTIVE,
            )
            db.add(product)
            await db.flush()

        # criar alias automático
        db.add(ProductAlias(product_id=product.id, alias=name, locale="pt-PT"))

        # 2) Criar/atualizar preço do fornecedor
        # marcar anteriores como não-correntes
        await db.execute(
            SupplierPrice.__table__.update()
            .where(SupplierPrice.product_id == product.id,
                   SupplierPrice.supplier_id == supplier.id,
                   SupplierPrice.is_current.is_(True))
            .values(is_current=False)
        )
        package_qty = pkg_size if pkg_size else 1
        sp = SupplierPrice(
            supplier_id=supplier.id,
            product_id=product.id,
            price=float(price),
            currency=(decision.currency if decision and decision.currency else row.get("currency") or "EUR"),
            unit_price=float(price) / max(float(package_qty), 1),
            package_qty=float(package_qty),
            source=PriceSource.IMPORT,
            source_ref=rec.original_filename,
        )
        db.add(sp)
        approved += 1

    rec.rows_approved = approved
    rec.rows_rejected = rejected
    rec.status = ImportStatus.APPROVED if approved else ImportStatus.REJECTED
    rec.approved_at = datetime.now(tz=timezone.utc)
    await audit(db, admin, AuditAction.APPROVE, "ImportRecord", rec.id,
                payload={"approved": approved, "rejected": rejected})
    await db.commit()
    await db.refresh(rec)
    return _to_out(rec)


def _to_out(rec: ImportRecord) -> ImportOut:
    return ImportOut(
        id=rec.id,
        supplier_id=rec.supplier_id,
        import_type=rec.import_type.value,
        original_filename=rec.original_filename,
        mime_type=rec.mime_type,
        size_bytes=rec.size_bytes,
        status=rec.status.value,
        rows_total=rec.rows_total,
        rows_approved=rec.rows_approved,
        rows_rejected=rec.rows_rejected,
        created_at=rec.created_at,
        approved_at=rec.approved_at,
        error_message=rec.error_message,
        extracted_rows=rec.extracted_rows or [],
        normalized_rows=[NormalizedRow(**r) for r in (rec.normalized_rows or [])],
    )
