"""API v1 router aggregator."""

from fastapi import APIRouter

from app.api.v1 import auth, products, suppliers, prices, orders, imports, analytics, users, admin, roi

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])
api_router.include_router(prices.router, prefix="/prices", tags=["prices"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(imports.router, prefix="/imports", tags=["imports"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(roi.router, prefix="/roi", tags=["roi"])
