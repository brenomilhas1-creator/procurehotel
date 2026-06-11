"""
Serviço de analytics: KPIs para o dashboard.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Product, PurchaseOrder, PurchaseOrderItem, OrderStatus, SupplierPrice, Supplier,
)


async def monthly_spend(db: AsyncSession, months: int = 12) -> list[dict]:
    """Total comprado por mês (últimos N meses)."""
    since = datetime.now(tz=timezone.utc) - timedelta(days=30 * months)
    rows = (
        await db.execute(
            select(
                func.date_trunc("month", PurchaseOrder.placed_at).label("month"),
                func.coalesce(func.sum(PurchaseOrder.total_amount), 0).label("total"),
                func.count(PurchaseOrder.id).label("orders"),
            )
            .where(PurchaseOrder.placed_at >= since,
                   PurchaseOrder.status == OrderStatus.PLACED)
            .group_by("month")
            .order_by("month")
        )
    ).all()
    return [
        {"month": r.month.strftime("%Y-%m"), "total": float(r.total), "orders": r.orders}
        for r in rows
    ]


async def top_products(db: AsyncSession, limit: int = 10) -> list[dict]:
    rows = (
        await db.execute(
            select(
                Product.id,
                Product.master_name,
                func.coalesce(func.sum(PurchaseOrderItem.quantity), 0).label("qty"),
                func.coalesce(func.sum(PurchaseOrderItem.line_total), 0).label("total"),
            )
            .join(PurchaseOrderItem, PurchaseOrderItem.product_id == Product.id)
            .join(PurchaseOrder, PurchaseOrder.id == PurchaseOrderItem.order_id)
            .where(PurchaseOrder.status == OrderStatus.PLACED)
            .group_by(Product.id, Product.master_name)
            .order_by(func.sum(PurchaseOrderItem.line_total).desc())
            .limit(limit)
        )
    ).all()
    return [
        {"product_id": str(r.id), "name": r.master_name, "quantity": float(r.qty), "total": float(r.total)}
        for r in rows
    ]


async def top_suppliers(db: AsyncSession, limit: int = 10) -> list[dict]:
    """Fornecedores mais 'competitivos' (com mais SKUs cobertos a melhor preço)."""
    # Para Fase 1, devolvemos os fornecedores com mais ordens + total
    rows = (
        await db.execute(
            select(
                Supplier.id,
                Supplier.name,
                func.count(PurchaseOrder.id).label("orders"),
                func.coalesce(func.sum(PurchaseOrder.total_amount), 0).label("total"),
            )
            .join(PurchaseOrder, PurchaseOrder.supplier_id == Supplier.id)
            .where(PurchaseOrder.status == OrderStatus.PLACED)
            .group_by(Supplier.id, Supplier.name)
            .order_by(func.sum(PurchaseOrder.total_amount).desc())
            .limit(limit)
        )
    ).all()
    return [
        {"supplier_id": str(r.id), "name": r.name, "orders": r.orders, "total": float(r.total)}
        for r in rows
    ]


async def price_variation(db: AsyncSession, product_id: str, days: int = 180) -> list[dict]:
    """Histórico de preço unitário do produto ao longo do tempo."""
    from uuid import UUID
    since = datetime.now(tz=timezone.utc) - timedelta(days=days)
    rows = (
        await db.execute(
            select(SupplierPrice.created_at, SupplierPrice.unit_price, Supplier.name)
            .join(Supplier, Supplier.id == SupplierPrice.supplier_id)
            .where(SupplierPrice.product_id == UUID(product_id),
                   SupplierPrice.created_at >= since)
            .order_by(SupplierPrice.created_at.asc())
        )
    ).all()
    return [
        {"date": r.created_at.isoformat(), "unit_price": float(r.unit_price), "supplier": r.name}
        for r in rows
    ]


async def savings_estimate(db: AsyncSession, days: int = 30) -> dict:
    """Estimativa de poupança: diferença entre preço real pago e preço médio histórico."""
    since = datetime.now(tz=timezone.utc) - timedelta(days=days)
    rows = (
        await db.execute(
            select(
                func.coalesce(func.sum(PurchaseOrderItem.line_total), 0).label("actual"),
            )
            .join(PurchaseOrder, PurchaseOrder.id == PurchaseOrderItem.order_id)
            .where(PurchaseOrder.placed_at >= since,
                   PurchaseOrder.status == OrderStatus.PLACED)
        )
    ).first()
    actual = float(rows.actual or 0) if rows else 0.0
    return {
        "period_days": days,
        "actual_spend": actual,
        "estimated_savings": 0.0,  # implementar com baseline em Fase 2
    }
