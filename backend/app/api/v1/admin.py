"""
Endpoints admin avançados (gestão, stats, audit log).
Apenas ADMIN.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AdminUser
from app.core.database import get_db
from app.models import (
    AuditAction, AuditLog, ImportRecord, ImportStatus,
    OrderStatus, Product, ProductAlias, PurchaseOrder, PurchaseOrderItem,
    Supplier, SupplierPrice, User, UserRole,
)

router = APIRouter(prefix="/admin", tags=["admin"])


# ---------- Dashboard ----------


@router.get("/dashboard")
async def admin_dashboard(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: AdminUser,
):
    """Stats gerais do sistema para o dashboard admin."""
    now = datetime.now(tz=timezone.utc)
    since_30d = now - timedelta(days=30)
    since_7d = now - timedelta(days=7)

    # Users
    total_users = (await db.execute(select(func.count(User.id)))).scalar_one()
    active_users = (await db.execute(select(func.count(User.id)).where(User.is_active.is_(True)))).scalar_one()
    admin_users = (
        await db.execute(select(func.count(User.id)).where(User.role == UserRole.ADMIN))
    ).scalar_one()

    # Products
    total_products = (await db.execute(select(func.count(Product.id)).where(Product.is_active.is_(True)))).scalar_one()
    total_aliases = (await db.execute(select(func.count(ProductAlias.id)))).scalar_one()

    # Suppliers
    total_suppliers = (await db.execute(select(func.count(Supplier.id)).where(Supplier.is_active.is_(True)))).scalar_one()
    preferred_suppliers = (
        await db.execute(select(func.count(Supplier.id)).where(Supplier.is_preferred.is_(True), Supplier.is_active.is_(True)))
    ).scalar_one()

    # Prices
    current_prices = (
        await db.execute(select(func.count(SupplierPrice.id)).where(SupplierPrice.is_current.is_(True)))
    ).scalar_one()

    # Orders
    total_orders = (await db.execute(select(func.count(PurchaseOrder.id)))).scalar_one()
    orders_30d = (
        await db.execute(
            select(func.count(PurchaseOrder.id)).where(PurchaseOrder.placed_at >= since_30d)
        )
    ).scalar_one()
    orders_7d = (
        await db.execute(
            select(func.count(PurchaseOrder.id)).where(PurchaseOrder.placed_at >= since_7d)
        )
    ).scalar_one()
    total_spend_30d = (
        await db.execute(
            select(func.coalesce(func.sum(PurchaseOrder.total_amount), 0))
            .where(PurchaseOrder.placed_at >= since_30d, PurchaseOrder.status == OrderStatus.PLACED)
        )
    ).scalar_one()

    # Imports
    total_imports = (await db.execute(select(func.count(ImportRecord.id)))).scalar_one()
    pending_imports = (
        await db.execute(
            select(func.count(ImportRecord.id))
            .where(ImportRecord.status.in_([
                ImportStatus.UPLOADED, ImportStatus.OCR_DONE,
                ImportStatus.NORMALIZED, ImportStatus.REVIEWING,
            ]))
        )
    ).scalar_one()
    failed_imports = (
        await db.execute(
            select(func.count(ImportRecord.id)).where(ImportRecord.status == ImportStatus.FAILED)
        )
    ).scalar_one()

    # Audit
    audit_30d = (
        await db.execute(select(func.count(AuditLog.id)).where(AuditLog.created_at >= since_30d))
    ).scalar_one()

    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "admins": admin_users,
        },
        "products": {
            "total": total_products,
            "aliases": total_aliases,
        },
        "suppliers": {
            "total": total_suppliers,
            "preferred": preferred_suppliers,
        },
        "prices": {
            "current": current_prices,
        },
        "orders": {
            "total": total_orders,
            "last_7d": orders_7d,
            "last_30d": orders_30d,
            "spend_30d_eur": float(total_spend_30d),
        },
        "imports": {
            "total": total_imports,
            "pending": pending_imports,
            "failed": failed_imports,
        },
        "audit": {
            "events_30d": audit_30d,
        },
        "generated_at": now.isoformat(),
    }


# ---------- Audit log ----------


@router.get("/audit-log")
async def list_audit_log(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: AdminUser,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    action: str | None = None,
    entity_type: str | None = None,
    user_id: UUID | None = None,
    days: int = Query(30, ge=1, le=365),
):
    """Lista logs de auditoria com filtros."""
    since = datetime.now(tz=timezone.utc) - timedelta(days=days)
    base = select(AuditLog).where(AuditLog.created_at >= since)
    if action:
        base = base.where(AuditLog.action == AuditAction(action))
    if entity_type:
        base = base.where(AuditLog.entity_type == entity_type)
    if user_id:
        base = base.where(AuditLog.user_id == user_id)

    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    rows = (
        await db.execute(
            base.order_by(AuditLog.created_at.desc())
            .offset((page - 1) * size).limit(size)
        )
    ).scalars().all()
    return {
        "items": [
            {
                "id": str(r.id),
                "user_id": str(r.user_id) if r.user_id else None,
                "action": r.action.value,
                "entity_type": r.entity_type,
                "entity_id": str(r.entity_id) if r.entity_id else None,
                "payload": r.payload,
                "ip_address": str(r.ip_address) if r.ip_address else None,
                "user_agent": r.user_agent,
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ],
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size,
    }


# ---------- Products management ----------


@router.get("/products")
async def list_all_products(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: AdminUser,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    q: str | None = None,
    include_inactive: bool = False,
):
    base = select(Product)
    if not include_inactive:
        base = base.where(Product.is_active.is_(True))
    if q:
        like = f"%{q}%"
        base = base.where(
            (Product.master_name.ilike(like))
            | (Product.brand.ilike(like))
            | (Product.sku.ilike(like))
        )
    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    rows = (
        await db.execute(
            base.order_by(Product.master_name.asc())
            .offset((page - 1) * size).limit(size)
        )
    ).scalars().all()
    return {
        "items": [
            {
                "id": str(p.id),
                "master_name": p.master_name,
                "brand": p.brand,
                "category": p.category,
                "unit": p.unit.value,
                "package_size": float(p.package_size) if p.package_size else None,
                "status": p.status.value,
                "substitution_allowed": p.substitution_allowed,
                "is_active": p.is_active,
                "sku": p.sku,
                "ean": p.ean,
                "aliases_count": len(p.aliases),
            }
            for p in rows
        ],
        "total": total,
        "page": page,
        "size": size,
    }


# ---------- Suppliers management ----------


@router.get("/suppliers")
async def list_all_suppliers(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: AdminUser,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    include_inactive: bool = False,
):
    base = select(Supplier)
    if not include_inactive:
        base = base.where(Supplier.is_active.is_(True))
    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    rows = (
        await db.execute(
            base.order_by(Supplier.name.asc())
            .offset((page - 1) * size).limit(size)
        )
    ).scalars().all()
    return {
        "items": [
            {
                "id": str(s.id),
                "name": s.name,
                "tax_id": s.tax_id,
                "contact_email": s.contact_email,
                "contact_phone": s.contact_phone,
                "is_preferred": s.is_preferred,
                "is_active": s.is_active,
                "min_order": float(s.minimum_order) if s.minimum_order else None,
                "lead_time_hours": s.delivery_lead_time_hours,
                "payment_terms": s.payment_terms,
                "prices_count": len(s.prices),
            }
            for s in rows
        ],
        "total": total,
        "page": page,
        "size": size,
    }


# ---------- Imports management ----------


@router.get("/imports")
async def list_all_imports(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: AdminUser,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
):
    base = select(ImportRecord)
    if status_filter:
        base = base.where(ImportRecord.status == ImportStatus(status_filter))
    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    rows = (
        await db.execute(
            base.order_by(ImportRecord.created_at.desc())
            .offset((page - 1) * size).limit(size)
        )
    ).scalars().all()
    return {
        "items": [
            {
                "id": str(r.id),
                "filename": r.original_filename,
                "status": r.status.value,
                "supplier_id": str(r.supplier_id) if r.supplier_id else None,
                "user_id": str(r.user_id),
                "rows_total": r.rows_total,
                "rows_approved": r.rows_approved,
                "rows_rejected": r.rows_rejected,
                "size_bytes": r.size_bytes,
                "created_at": r.created_at.isoformat(),
                "approved_at": r.approved_at.isoformat() if r.approved_at else None,
                "error_message": r.error_message,
            }
            for r in rows
        ],
        "total": total,
        "page": page,
        "size": size,
    }


# ---------- Price alerts (variação significativa) ----------


@router.get("/price-alerts")
async def price_alerts(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: AdminUser,
    threshold_pct: float = Query(10.0, ge=1, le=100, description="Alerta se variação > X%"),
    days: int = Query(30, ge=7, le=180),
):
    """Deteta produtos cujo preço subiu > threshold_pct nos últimos X dias."""
    since = datetime.now(tz=timezone.utc) - timedelta(days=days)
    # Avg price por produto (current vs ago)
    rows = (
        await db.execute(
            select(
                Product.id,
                Product.master_name,
                Product.brand,
                func.max(SupplierPrice.price).filter(SupplierPrice.created_at >= since).label("recent"),
                func.min(SupplierPrice.price).filter(SupplierPrice.created_at < since).label("old"),
            )
            .join(SupplierPrice, SupplierPrice.product_id == Product.id)
            .where(Product.is_active.is_(True))
            .group_by(Product.id, Product.master_name, Product.brand)
        )
    ).all()
    alerts = []
    for r in rows:
        if r.recent and r.old and r.old > 0:
            change_pct = ((r.recent - r.old) / r.old) * 100
            if abs(change_pct) >= threshold_pct:
                alerts.append({
                    "product_id": str(r.id),
                    "product_name": r.master_name,
                    "brand": r.brand,
                    "old_price": float(r.old),
                    "new_price": float(r.recent),
                    "change_pct": round(change_pct, 2),
                    "direction": "up" if change_pct > 0 else "down",
                    "period_days": days,
                })
    alerts.sort(key=lambda a: -abs(a["change_pct"]))
    return {"threshold_pct": threshold_pct, "alerts": alerts[:50]}
