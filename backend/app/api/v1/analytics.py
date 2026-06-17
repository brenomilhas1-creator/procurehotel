"""Analytics endpoints para o dashboard."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentUser
from app.core.database import get_db
from app.services.analytics import (
    monthly_spend, top_products, top_suppliers, price_variation, savings_estimate,
)

router = APIRouter()


@router.get("/summary")
async def summary(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
):
    return {
        "monthly_spend": await monthly_spend(db),
        "top_products": await top_products(db),
        "top_suppliers": await top_suppliers(db),
        "savings": await savings_estimate(db),
    }


@router.get("/price-variation/{product_id}")
async def price_variation_endpoint(
    product_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: CurrentUser,
    days: int = 180,
):
    return await price_variation(db, product_id, days=days)
