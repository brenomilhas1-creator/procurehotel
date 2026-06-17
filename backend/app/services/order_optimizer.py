"""
Motor de otimização de pedidos.

Responsabilidades:
  1. Receber uma lista de ParsedItem (saída da IA ou input direto)
  2. Fazer matching com o catálogo de produtos (master + aliases + fuzzy)
  3. Escolher, para cada item, o fornecedor com menor custo total
  4. Sugerir substituições quando o produto está bloqueado / indisponível
  5. Agrupar o resultado por fornecedor, pronto para "Copiar pedido"
"""

from __future__ import annotations

import re
import uuid
from collections import defaultdict
from dataclasses import dataclass
from typing import Iterable

from loguru import logger
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Product, ProductAlias, ProductStatus, Supplier, SupplierPrice,
    UnitOfMeasure,
)
from app.services.ai_normalizer import ParsedItem, _normalize_text, _parse_number


@dataclass
class OptimizedLine:
    raw_line: str
    product_id: uuid.UUID
    product_name: str
    quantity: float
    unit: str
    supplier_id: uuid.UUID
    supplier_name: str
    unit_price: float
    line_total: float
    is_substitution: bool = False
    substitution_reason: str | None = None
    alternatives: list["OptimizedLine"] = None  # type: ignore


# ---------------------------------------------------------------------------
# Matching
# ---------------------------------------------------------------------------


_UNIT_CONVERSION = {
    # converte para a unidade base de cada produto (heurística simples)
    "kg": ("g", 1000),
    "g": ("g", 1),
    "l": ("ml", 1000),
    "ml": ("ml", 1),
    "cx": ("un", 1),
    "pc": ("un", 1),
    "sc": ("un", 1),
    "dz": ("un", 12),
    "gf": ("un", 1),
    "lt": ("un", 1),
    "un": ("un", 1),
}


def _units_compatible(req_unit: str, product_unit: str) -> bool:
    """Verifica se a unidade pedida é compatível com a unidade base do produto."""
    return req_unit == product_unit or req_unit in _UNIT_CONVERSION


# ---------------------------------------------------------------------------
# Otimização
# ---------------------------------------------------------------------------


async def match_product(
    db: AsyncSession,
    item: ParsedItem,
) -> Product | None:
    """Match de ParsedItem -> Product. Estratégia: exact alias -> master_name -> fuzzy."""
    name_norm = _normalize_text(item.product_name or item.raw_line)

    # 1. alias exato
    row = (
        await db.execute(
            select(ProductAlias)
            .where(func.lower(ProductAlias.alias) == name_norm)
            .limit(1)
        )
    ).scalar_one_or_none()
    if row:
        # atualizar contador
        row.hit_count = (row.hit_count or 0) + 1
        product = await db.get(Product, row.product_id)
        if product and product.status == ProductStatus.ACTIVE and product.is_active:
            return product

    # 2. master_name exato
    row = (
        await db.execute(
            select(Product)
            .where(func.lower(Product.master_name) == name_norm)
            .limit(1)
        )
    ).scalar_one_or_none()
    if row and row.status == ProductStatus.ACTIVE and row.is_active:
        return row

    # 3. fuzzy ILIKE no master_name + aliases
    like = f"%{name_norm}%"
    rows = (
        await db.execute(
            select(Product).where(
                Product.is_active.is_(True),
                Product.status == ProductStatus.ACTIVE,
                or_(Product.master_name.ilike(like), Product.brand.ilike(like)),
            ).limit(5)
        )
    ).scalars().all()
    if rows:
        return rows[0]

    # 4. tentar match por alias ILIKE
    alias_rows = (
        await db.execute(
            select(Product)
            .join(ProductAlias, ProductAlias.product_id == Product.id)
            .where(
                Product.is_active.is_(True),
                Product.status == ProductStatus.ACTIVE,
                ProductAlias.alias.ilike(like),
            )
            .limit(5)
        )
    ).scalars().all()
    return alias_rows[0] if alias_rows else None


async def find_substitute(db: AsyncSession, original: Product) -> Product | None:
    """Substitutos permitidos: mesmo nome aproximado OU substitution_of_id."""
    if not original.substitution_allowed:
        return None
    # 1. substitution_of_id explícito
    if original.substitution_of_id:
        sub = await db.get(Product, original.substitution_of_id)
        if sub and sub.status == ProductStatus.ACTIVE and sub.is_active:
            return sub
    # 2. mesmo master_name mas outra marca (heurística)
    rows = (
        await db.execute(
            select(Product).where(
                Product.id != original.id,
                Product.is_active.is_(True),
                Product.status == ProductStatus.ACTIVE,
                Product.brand != original.brand,
                Product.master_name.ilike(f"%{_normalize_text(original.master_name)}%"),
            ).limit(1)
        )
    ).scalars().all()
    return rows[0] if rows else None


async def choose_best_price(
    db: AsyncSession, product: Product, qty: float,
) -> tuple[SupplierPrice, Supplier] | None:
    """Devolve o SupplierPrice + Supplier com menor preço total (preço * qty embalagem)."""
    rows = (
        await db.execute(
            select(SupplierPrice, Supplier)
            .join(Supplier, Supplier.id == SupplierPrice.supplier_id)
            .where(
                SupplierPrice.product_id == product.id,
                SupplierPrice.is_current.is_(True),
                Supplier.is_active.is_(True),
            )
            .order_by(SupplierPrice.unit_price.asc())
        )
    ).all()
    if not rows:
        return None
    best_price, best_supplier = rows[0]
    return best_price, best_supplier


async def optimize(
    db: AsyncSession, items: Iterable[ParsedItem]
) -> tuple[list[OptimizedLine], list[ParsedItem]]:
    """Devolve (linhas otimizadas, itens sem match)."""
    optimized: list[OptimizedLine] = []
    unmatchable: list[ParsedItem] = []
    for item in items:
        product = await match_product(db, item)
        if product is None:
            unmatchable.append(item)
            continue

        if not _units_compatible(item.unit, product.unit.value):
            unmatchable.append(item)
            continue

        best = await choose_best_price(db, product, item.quantity)
        if best is None:
            unmatchable.append(item)
            continue

        price, supplier = best
        line_total = round(float(price.price) * (item.quantity / max(float(price.package_qty), 1)), 2)
        is_sub = False
        reason = None
        # se o produto está oculto/bloqueado, tentar substituto
        if product.status != ProductStatus.ACTIVE:
            sub = await find_substitute(db, product)
            if sub:
                sub_best = await choose_best_price(db, sub, item.quantity)
                if sub_best:
                    product = sub
                    price, supplier = sub_best
                    is_sub = True
                    reason = f"Substituído por {sub.master_name}"

        optimized.append(OptimizedLine(
            raw_line=item.raw_line,
            product_id=product.id,
            product_name=product.master_name,
            quantity=item.quantity,
            unit=item.unit,
            supplier_id=supplier.id,
            supplier_name=supplier.name,
            unit_price=float(price.unit_price),
            line_total=line_total,
            is_substitution=is_sub,
            substitution_reason=reason,
        ))
    return optimized, unmatchable


def group_by_supplier(lines: list[OptimizedLine]) -> dict[uuid.UUID, list[OptimizedLine]]:
    grouped: dict[uuid.UUID, list[OptimizedLine]] = defaultdict(list)
    for l in lines:
        grouped[l.supplier_id].append(l)
    return grouped
