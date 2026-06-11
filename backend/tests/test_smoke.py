"""Smoke tests da configuração principal."""

from __future__ import annotations

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token, decode_token
from app.models import Product, Supplier, User, UserRole
from app.schemas.order import OrderOptimizeRequest, FreeTextItemIn


def test_settings_loaded():
    assert settings.app_name == "ProcureHotel"
    assert settings.api_v1_prefix == "/api/v1"


def test_password_hashing():
    h = hash_password("minha-pass-segura")
    assert verify_password("minha-pass-segura", h) is True
    assert verify_password("errada", h) is False


def test_jwt_roundtrip():
    token = create_access_token("user-id-123", extra_claims={"role": "admin"})
    payload = decode_token(token)
    assert payload["sub"] == "user-id-123"
    assert payload["role"] == "admin"
    assert payload["type"] == "access"


def test_models_import():
    # garante que todos os modelos importam sem ciclos
    from app.models import (
        User, Product, ProductAlias, Supplier, SupplierPrice,
        PurchaseOrder, PurchaseOrderItem, ImportRecord, AuditLog,
    )
    assert User.__tablename__ == "users"
    assert Product.__tablename__ == "products"
    assert Supplier.__tablename__ == "suppliers"


def test_schemas_validate():
    req = OrderOptimizeRequest(items=[
        FreeTextItemIn(raw_line="10 cx coca cola", quantity=10, unit="cx", product_name="Coca Cola 33cl")
    ])
    assert len(req.items) == 1
    assert req.items[0].quantity == 10
