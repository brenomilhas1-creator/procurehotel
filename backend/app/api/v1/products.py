"""Products + Aliases endpoints."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AdminUser, CurrentUser, audit
from app.core.database import get_db
from app.models import AuditAction, Product, ProductAlias, ProductStatus
from app.schemas.common import Page
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate, ProductAliasIn, ProductAliasOut

router = APIRouter()


@router.get("", response_model=Page[ProductOut])
async def list_products(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    q: str | None = None,
    category: str | None = None,
    brand: str | None = None,
    status_: str | None = Query(None, alias="status"),
    active_only: bool = True,
):
    base = select(Product)
    if active_only:
        base = base.where(Product.is_active.is_(True))
    if q:
        like = f"%{q}%"
        base = base.where(
            or_(
                Product.master_name.ilike(like),
                Product.brand.ilike(like),
                Product.sku.ilike(like),
                Product.ean == q,
            )
        )
    if category:
        base = base.where(Product.category == category)
    if brand:
        base = base.where(Product.brand == brand)
    if status_:
        base = base.where(Product.status == ProductStatus(status_))

    total = (
        await db.execute(select(func.count()).select_from(base.subquery()))
    ).scalar_one()
    rows = (
        await db.execute(
            base.order_by(Product.master_name.asc()).offset((page - 1) * size).limit(size)
        )
    ).scalars().all()
    return Page(
        items=[ProductOut.model_validate(r) for r in rows],
        total=total, page=page, size=size, pages=(total + size - 1) // size,
    )


@router.get("/search", response_model=list[ProductOut])
async def search_products(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
):
    """Pesquisa rápida com fuzzy match em master_name + aliases."""
    from sqlalchemy import text

    rows = (
        await db.execute(
            text("""
                SELECT p.* FROM products p
                WHERE p.is_active = true
                  AND (
                    p.master_name ILIKE :like
                    OR p.brand ILIKE :like
                    OR EXISTS (
                        SELECT 1 FROM product_aliases a
                        WHERE a.product_id = p.id AND a.alias ILIKE :like
                    )
                  )
                ORDER BY p.master_name
                LIMIT :limit
            """),
            {"like": f"%{q}%", "limit": limit},
        )
    ).mappings().all()
    return [ProductOut.model_validate(dict(r)) for r in rows]


@router.post("", response_model=ProductOut, status_code=201)
async def create_product(
    body: ProductCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: AdminUser,
):
    if (
        await db.execute(
            select(Product).where(Product.sku == body.sku) if body.sku else select(Product).where(False)
        )
    ).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="SKU já existe")

    product = Product(
        master_name=body.master_name,
        brand=body.brand,
        category=body.category,
        unit=body.unit,
        package_size=body.package_size,
        package_unit=body.package_unit,
        substitution_allowed=body.substitution_allowed,
        description=body.description,
        sku=body.sku,
        ean=body.ean,
    )
    for a in body.aliases:
        product.aliases.append(ProductAlias(alias=a.alias, locale=a.locale))
    db.add(product)
    await db.flush()
    await audit(db, admin, AuditAction.CREATE, "Product", product.id, payload={"name": body.master_name})
    await db.commit()
    await db.refresh(product)
    return product


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(
    product_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
):
    p = await db.get(Product, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return p


@router.patch("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: UUID,
    body: ProductUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: AdminUser,
):
    p = await db.get(Product, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    data = body.model_dump(exclude_unset=True)
    if "status" in data:
        p.status = ProductStatus(data.pop("status"))
    for k, v in data.items():
        setattr(p, k, v)
    await audit(db, admin, AuditAction.UPDATE, "Product", p.id, payload=data)
    await db.commit()
    await db.refresh(p)
    return p


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: AdminUser,
):
    p = await db.get(Product, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    # soft delete: esconde
    p.is_active = False
    p.status = ProductStatus.HIDDEN
    await audit(db, admin, AuditAction.DELETE, "Product", p.id)
    await db.commit()


@router.post("/{product_id}/aliases", response_model=ProductAliasOut, status_code=201)
async def add_alias(
    product_id: UUID,
    body: ProductAliasIn,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: AdminUser,
):
    p = await db.get(Product, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    alias = ProductAlias(product_id=p.id, alias=body.alias, locale=body.locale)
    db.add(alias)
    await db.commit()
    await db.refresh(alias)
    return alias
