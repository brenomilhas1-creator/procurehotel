"""
Importação central dos modelos — registo na Base.metadata.
"""

from app.models.user import User, UserRole  # noqa: F401
from app.models.product import Product, ProductAlias, ProductStatus, UnitOfMeasure  # noqa: F401
from app.models.supplier import Supplier  # noqa: F401
from app.models.price import SupplierPrice, PriceSource  # noqa: F401
from app.models.order import PurchaseOrder, PurchaseOrderItem, OrderStatus  # noqa: F401
from app.models.import_ import ImportRecord, ImportStatus, ImportType  # noqa: F401
from app.models.audit import AuditLog, AuditAction  # noqa: F401

__all__ = [
    "User", "UserRole",
    "Product", "ProductAlias", "ProductStatus", "UnitOfMeasure",
    "Supplier",
    "SupplierPrice", "PriceSource",
    "PurchaseOrder", "PurchaseOrderItem", "OrderStatus",
    "ImportRecord", "ImportStatus", "ImportType",
    "AuditLog", "AuditAction",
]
