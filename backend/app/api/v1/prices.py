"""Supplier prices endpoints + comparison helpers."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AdminUser, CurrentUser, audit
from app.core.database import get_db
from app.models import (
    AuditAction, PriceSource, Product, Supplier, SupplierPrice, ProductStatus,
)
from app.schemas.common import Page
from app.schemas.supplier import SupplierPriceCreate, SupplierPriceOut

router = APIRouter()


def _compute_unit_price(price: float, package_qty: float) -> float:
    if not package_qty or package_qty <= 0:
        return price
    return price / package_qty


@router.get("", response_model=Page[SupplierPriceOut])
async def list_prices(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=200),
    supplier_id: UUID | None = None,
    product_id: UUID | None = None,
    current_only: bool = True,
):
    base = select(SupplierPrice)
    if current_only:
        base = base.where(SupplierPrice.is_current.is_(True))
    if supplier_id:
        base = base.where(SupplierPrice.supplier_id == supplier_id)
    if product_id:
        base = base.where(SupplierPrice.product_id == product_id)

    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    rows = (
        await db.execute(base.order_by(SupplierPrice.unit_price.asc())
                         .offset((page - 1) * size).limit(size))
    ).scalars().all()
    return Page(
        items=[SupplierPriceOut.model_validate(r) for r in rows],
        total=total, page=page, size=size, pages=(total + size - 1) // size,
    )


@router.post("", response_model=SupplierPriceOut, status_code=201)
async def create_price(
    body: SupplierPriceCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: AdminUser,
):
    if not await db.get(Supplier, body.supplier_id):
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    if not await db.get(Product, body.product_id):
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    # Marcar anteriores como não-correntes
    await db.execute(
        SupplierPrice.__table__.update()
        .where(SupplierPrice.product_id == body.product_id,
               SupplierPrice.supplier_id == body.supplier_id,
               SupplierPrice.is_current.is_(True))
        .values(is_current=False)
    )

    price = SupplierPrice(
        supplier_id=body.supplier_id,
        product_id=body.product_id,
        price=body.price,
        currency=body.currency,
        unit_price=_compute_unit_price(body.price, body.package_qty),
        package_qty=body.package_qty,
        min_order_qty=body.min_order_qty,
        valid_from=body.valid_from,
        valid_until=body.valid_until,
        source=PriceSource(body.source),
        notes=body.notes,
    )
    db.add(price)
    await db.flush()
    await audit(db, admin, AuditAction.CREATE, "SupplierPrice", price.id)
    await db.commit()
    await db.refresh(price)
    return price


@router.get("/compare/{product_id}")
async def compare_prices(
    product_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
):
    """Devolve todos os preços correntes do produto, ordenados por melhor."""
    rows = (
        await db.execute(
            select(SupplierPrice, Supplier.name)
            .join(Supplier, Supplier.id == SupplierPrice.supplier_id)
            .where(SupplierPrice.product_id == product_id,
                   SupplierPrice.is_current.is_(True),
                   Supplier.is_active.is_(True))
            .order_by(SupplierPrice.unit_price.asc())
        )
    ).all()
    if not rows:
        raise HTTPException(status_code=404, detail="Sem preços para este produto")
    return [
        {
            "supplier_id": str(supplier_id),
            "supplier_name": supplier_name,
            "price": float(price.price),
            "unit_price": float(price.unit_price),
            "currency": price.currency,
            "package_qty": float(price.package_qty),
            "min_order_qty": float(price.min_order_qty),
            "valid_until": price.valid_until.isoformat() if price.valid_until else None,
        }
        for price, supplier_name in rows
    ]


@router.delete("/{price_id}", status_code=204)
async def delete_price(
    price_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: AdminUser,
):
    p = await db.get(SupplierPrice, price_id)
    if not p:
        raise HTTPException(status_code=404, detail="Preço não encontrado")
    await audit(db, admin, AuditAction.DELETE, "SupplierPrice", p.id)
    await db.delete(p)
    await db.commit()
