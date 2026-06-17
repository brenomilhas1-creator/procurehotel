"""Suppliers endpoints."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AdminUser, CurrentUser, audit
from app.core.database import get_db
from app.models import AuditAction, Supplier
from app.schemas.common import Page
from app.schemas.supplier import SupplierCreate, SupplierOut, SupplierUpdate

router = APIRouter()


@router.get("", response_model=Page[SupplierOut])
async def list_suppliers(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    q: str | None = None,
    active_only: bool = True,
):
    base = select(Supplier)
    if active_only:
        base = base.where(Supplier.is_active.is_(True))
    if q:
        like = f"%{q}%"
        base = base.where(or_(Supplier.name.ilike(like), Supplier.tax_id.ilike(like)))
    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    rows = (
        await db.execute(base.order_by(Supplier.name.asc()).offset((page - 1) * size).limit(size))
    ).scalars().all()
    return Page(
        items=[SupplierOut.model_validate(r) for r in rows],
        total=total, page=page, size=size, pages=(total + size - 1) // size,
    )


@router.post("", response_model=SupplierOut, status_code=201)
async def create_supplier(
    body: SupplierCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: AdminUser,
):
    if (await db.execute(select(Supplier).where(Supplier.name == body.name))).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Fornecedor com esse nome já existe")
    s = Supplier(**body.model_dump())
    db.add(s)
    await db.flush()
    await audit(db, admin, AuditAction.CREATE, "Supplier", s.id, payload={"name": s.name})
    await db.commit()
    await db.refresh(s)
    return s


@router.get("/{supplier_id}", response_model=SupplierOut)
async def get_supplier(
    supplier_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
):
    s = await db.get(Supplier, supplier_id)
    if not s:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    return s


@router.patch("/{supplier_id}", response_model=SupplierOut)
async def update_supplier(
    supplier_id: UUID,
    body: SupplierUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: AdminUser,
):
    s = await db.get(Supplier, supplier_id)
    if not s:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(s, k, v)
    await audit(db, admin, AuditAction.UPDATE, "Supplier", s.id, payload=data)
    await db.commit()
    await db.refresh(s)
    return s


@router.delete("/{supplier_id}", status_code=204)
async def delete_supplier(
    supplier_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: AdminUser,
):
    s = await db.get(Supplier, supplier_id)
    if not s:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    s.is_active = False
    await audit(db, admin, AuditAction.DELETE, "Supplier", s.id)
    await db.commit()
