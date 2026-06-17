"""Orders: parse + optimize + persist + status transitions."""

from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser, audit
from app.core.database import get_db
from app.models import (
    AuditAction, OrderStatus, Product, PurchaseOrder, PurchaseOrderItem, Supplier,
)
from app.schemas.common import Page
from app.schemas.order import (
    FreeTextParseRequest,
    FreeTextParseResponse,
    OrderOptimizeRequest,
    OrderOptimizeResponse,
    OptimizedSupplierGroup,
    PurchaseOrderItemOut,
    PurchaseOrderOut,
    PurchaseOrderUpdate,
)
from app.services.ai_normalizer import ai_normalizer
from app.services.order_optimizer import (
    OptimizedLine,
    group_by_supplier,
    optimize,
)

router = APIRouter()


def _line_to_dict(l: OptimizedLine) -> dict:
    return {
        "raw_line": l.raw_line,
        "product_id": l.product_id,
        "product_name": l.product_name,
        "quantity": l.quantity,
        "unit": l.unit,
        "supplier_id": l.supplier_id,
        "supplier_name": l.supplier_name,
        "unit_price": l.unit_price,
        "line_total": l.line_total,
        "is_substitution": l.is_substitution,
        "substitution_reason": l.substitution_reason,
        "alternatives": [],
    }


def _generate_code() -> str:
    return f"PO-{datetime.now(tz=timezone.utc):%Y%m%d}-{secrets.token_hex(3).upper()}"


# ---------------------------------------------------------------------------
# Parsing livre
# ---------------------------------------------------------------------------


@router.post("/parse", response_model=FreeTextParseResponse)
async def parse_text(
    body: FreeTextParseRequest,
    _: CurrentUser,
):
    items = await ai_normalizer.parse_free_text(body.text)
    return FreeTextParseResponse(
        items=[
            {
                "raw_line": i.raw_line,
                "product_name": i.product_name,
                "product_id": None,
                "quantity": i.quantity,
                "unit": i.unit,
                "brand": i.brand,
                "notes": i.notes,
            }
            for i in items
        ],
        ambiguous=[i for i in items if (i.confidence or 0) < 0.6],
    )


# ---------------------------------------------------------------------------
# Otimização
# ---------------------------------------------------------------------------


@router.post("/optimize", response_model=OrderOptimizeResponse)
async def optimize_order(
    body: OrderOptimizeRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
):
    parsed = [
        await _to_parsed(i) for i in body.items
    ]
    lines, unmatched = await optimize(db, parsed)
    grouped = group_by_supplier(lines)
    grand = round(sum(l.line_total for l in lines), 2)

    groups = [
        OptimizedSupplierGroup(
            supplier_id=sid,
            supplier_name=lines[0].supplier_name,
            items=[_line_to_dict(l) for l in lines],
            total=round(sum(l.line_total for l in lines), 2),
            item_count=len(lines),
        )
        for sid, lines in grouped.items()
    ]
    return OrderOptimizeResponse(groups=groups, grand_total=grand,
                                 unmatchable=unmatched)


async def _to_parsed(i) -> "ai_normalizer.ParsedItem":  # type: ignore
    from app.services.ai_normalizer import ParsedItem
    return ParsedItem(
        raw_line=i.raw_line,
        quantity=float(i.quantity),
        unit=i.unit,
        product_name=i.product_name,
        brand=i.brand,
        confidence=1.0,
        notes=i.notes,
    )


# ---------------------------------------------------------------------------
# Persistência
# ---------------------------------------------------------------------------


@router.post("/commit", response_model=list[PurchaseOrderOut], status_code=201)
async def commit_optimized(
    groups: list[OptimizedSupplierGroup],
    raw_input: str | None = None,
    db: AsyncSession = None,  # type: ignore
    user: CurrentUser = None,  # type: ignore
):
    if not groups:
        raise HTTPException(status_code=400, detail="Sem grupos para gravar")
    if db is None or user is None:  # helper, não deve acontecer
        raise HTTPException(status_code=500, detail="internal")

    created: list[PurchaseOrder] = []
    for g in groups:
        code = _generate_code()
        total = sum(i.line_total for i in g.items)
        order = PurchaseOrder(
            code=code,
            user_id=user.id,
            supplier_id=g.supplier_id,
            total_amount=total,
            raw_input=raw_input,
        )
        db.add(order)
        await db.flush()
        for i in g.items:
            item = PurchaseOrderItem(
                order_id=order.id,
                product_id=i.product_id,
                supplier_price_id=None,  # resolver em background
                raw_line=i.raw_line,
                quantity=i.quantity,
                unit_price=i.unit_price,
                line_total=i.line_total,
                is_substitution=i.is_substitution,
                substitution_reason=i.substitution_reason,
            )
            db.add(item)
        await db.flush()
        await audit(db, user, AuditAction.CREATE, "PurchaseOrder", order.id,
                    payload={"code": code, "supplier": g.supplier_name, "total": total})
        created.append(order)

    await db.commit()
    for o in created:
        await db.refresh(o, attribute_names=["items", "supplier", "user"])
    return [_order_out(o) for o in created]


@router.get("", response_model=Page[PurchaseOrderOut])
async def list_orders(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status_: str | None = Query(None, alias="status"),
):
    base = select(PurchaseOrder)
    if status_:
        base = base.where(PurchaseOrder.status == OrderStatus(status_))
    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    rows = (
        await db.execute(
            base.order_by(PurchaseOrder.created_at.desc())
            .offset((page - 1) * size).limit(size)
        )
    ).scalars().all()
    out: list[PurchaseOrder] = []
    for r in rows:
        await db.refresh(r, attribute_names=["items", "supplier"])
        out.append(r)
    return Page(
        items=[_order_out(o) for o in out],
        total=total, page=page, size=size, pages=(total + size - 1) // size,
    )


@router.get("/{order_id}", response_model=PurchaseOrderOut)
async def get_order(
    order_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
):
    o = await db.get(PurchaseOrder, order_id)
    if not o:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    await db.refresh(o, attribute_names=["items", "supplier"])
    return _order_out(o)


@router.patch("/{order_id}", response_model=PurchaseOrderOut)
async def update_order(
    order_id: uuid.UUID,
    body: PurchaseOrderUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
):
    o = await db.get(PurchaseOrder, order_id)
    if not o:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    data = body.model_dump(exclude_unset=True)
    if "status" in data:
        new_status = OrderStatus(data.pop("status"))
        if new_status == OrderStatus.PLACED and o.status != OrderStatus.PLACED:
            o.placed_at = datetime.now(tz=timezone.utc)
            await audit(db, user, AuditAction.ORDER_PLACED, "PurchaseOrder", o.id)
        o.status = new_status
    for k, v in data.items():
        setattr(o, k, v)
    await db.commit()
    await db.refresh(o, attribute_names=["items", "supplier"])
    return _order_out(o)


def _order_out(o: PurchaseOrder) -> PurchaseOrderOut:
    return PurchaseOrderOut(
        id=o.id,
        code=o.code,
        status=o.status.value,
        supplier_id=o.supplier_id,
        supplier_name=o.supplier.name if o.supplier else "",
        user_id=o.user_id,
        total_amount=float(o.total_amount),
        currency=o.currency,
        raw_input=o.raw_input,
        notes=o.notes,
        placed_at=o.placed_at.isoformat() if o.placed_at else None,
        items=[
            PurchaseOrderItemOut(
                id=i.id,
                product_id=i.product_id,
                product_name=i.product.master_name if i.product else "",
                raw_line=i.raw_line,
                quantity=float(i.quantity),
                unit_price=float(i.unit_price),
                line_total=float(i.line_total),
                is_substitution=i.is_substitution,
                substitution_reason=i.substitution_reason,
            )
            for i in (o.items or [])
        ],
    )
