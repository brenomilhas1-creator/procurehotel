"""initial schema

Revision ID: 0001_init
Revises:
Create Date: 2026-01-01 00:00:00
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001_init"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "vector"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pg_trgm"')

    user_role = sa.Enum("admin", "user", name="user_role")
    product_status = sa.Enum("active", "hidden", "blocked", name="product_status")
    unit_of_measure = sa.Enum(
        "un", "kg", "g", "l", "ml", "cx", "pc", "gf", "lt", "sc", "dz",
        name="unit_of_measure",
    )
    price_source = sa.Enum("manual", "import", "ocr", name="price_source")
    order_status = sa.Enum("draft", "copied", "placed", "cancelled", name="order_status")
    import_status = sa.Enum(
        "uploaded", "ocr_done", "normalized", "reviewing",
        "approved", "rejected", "failed", name="import_status",
    )
    import_type = sa.Enum("price_list", "invoice", name="import_type")
    audit_action = sa.Enum(
        "create", "update", "delete", "approve", "reject",
        "login", "logout", "import", "export", "order_placed", "password_reset",
        name="audit_action",
    )

    # users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", user_role, nullable=False, server_default="user"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("tenant_id", sa.String(64), nullable=True, index=True),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # products
    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("master_name", sa.String(255), nullable=False, index=True),
        sa.Column("brand", sa.String(128), nullable=True, index=True),
        sa.Column("category", sa.String(128), nullable=True, index=True),
        sa.Column("unit", unit_of_measure, nullable=False, server_default="un"),
        sa.Column("package_size", sa.Numeric(12, 3), nullable=True),
        sa.Column("package_unit", unit_of_measure, nullable=True),
        sa.Column("status", product_status, nullable=False, server_default="active", index=True),
        sa.Column("substitution_allowed", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("sku", sa.String(64), nullable=True, unique=True, index=True),
        sa.Column("ean", sa.String(32), nullable=True, index=True),
        sa.Column("substitution_of_id", postgresql.UUID(as_uuid=True), nullable=True,
                  sa.ForeignKey("products.id", ondelete="SET NULL")),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true(), index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "product_aliases",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("product_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("alias", sa.String(255), nullable=False, index=True),
        sa.Column("locale", sa.String(8), nullable=False, server_default="pt-PT"),
        sa.Column("hit_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("product_id", "alias", "locale", name="uq_alias_product_alias_locale"),
    )

    op.create_table(
        "suppliers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(255), nullable=False, index=True),
        sa.Column("tax_id", sa.String(32), nullable=True, index=True),
        sa.Column("contact_name", sa.String(255), nullable=True),
        sa.Column("contact_email", sa.String(255), nullable=True),
        sa.Column("contact_phone", sa.String(64), nullable=True),
        sa.Column("address", sa.Text, nullable=True),
        sa.Column("website", sa.String(255), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("payment_terms", sa.String(255), nullable=True),
        sa.Column("delivery_lead_time_hours", sa.Integer, nullable=True),
        sa.Column("minimum_order", sa.Numeric(12, 2), nullable=True),
        sa.Column("is_preferred", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=True, index=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "supplier_prices",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("supplier_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("suppliers.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("product_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("price", sa.Numeric(12, 4), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="EUR"),
        sa.Column("unit_price", sa.Numeric(12, 6), nullable=False, index=True),
        sa.Column("package_qty", sa.Numeric(12, 3), nullable=False, server_default="1"),
        sa.Column("min_order_qty", sa.Numeric(12, 3), nullable=False, server_default="1"),
        sa.Column("valid_from", sa.DateTime(timezone=True), nullable=True),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=True, index=True),
        sa.Column("source", price_source, nullable=False, server_default="manual"),
        sa.Column("source_ref", sa.String(255), nullable=True),
        sa.Column("is_current", sa.Boolean, nullable=False, server_default=sa.true(), index=True),
        sa.Column("notes", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "purchase_orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("code", sa.String(32), nullable=False, unique=True, index=True),
        sa.Column("status", order_status, nullable=False, server_default="draft", index=True),
        sa.Column("raw_input", sa.Text, nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("supplier_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(3), nullable=False, server_default="EUR"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("placed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expected_delivery", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "purchase_order_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("order_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("product_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("supplier_price_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("supplier_prices.id", ondelete="SET NULL"), nullable=True),
        sa.Column("raw_line", sa.String(255), nullable=True),
        sa.Column("quantity", sa.Numeric(12, 3), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 4), nullable=False),
        sa.Column("line_total", sa.Numeric(12, 2), nullable=False),
        sa.Column("is_substitution", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("substitution_reason", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "imports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("supplier_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("import_type", import_type, nullable=False, server_default="price_list"),
        sa.Column("original_filename", sa.String(255), nullable=False),
        sa.Column("stored_path", sa.String(512), nullable=False),
        sa.Column("mime_type", sa.String(128), nullable=True),
        sa.Column("size_bytes", sa.BigInteger, nullable=False, server_default="0"),
        sa.Column("status", import_status, nullable=False, server_default="uploaded", index=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("extracted_rows", postgresql.JSONB, nullable=True),
        sa.Column("normalized_rows", postgresql.JSONB, nullable=True),
        sa.Column("rows_total", sa.Integer, nullable=False, server_default="0"),
        sa.Column("rows_approved", sa.Integer, nullable=False, server_default="0"),
        sa.Column("rows_rejected", sa.Integer, nullable=False, server_default="0"),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("action", audit_action, nullable=False),
        sa.Column("entity_type", sa.String(64), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("payload", postgresql.JSONB, nullable=True),
        sa.Column("ip_address", postgresql.INET, nullable=True),
        sa.Column("user_agent", sa.String(512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_audit_logs_user_created", "audit_logs", ["user_id", "created_at"])
    op.create_index("ix_audit_logs_entity", "audit_logs", ["entity_type", "entity_id"])


def downgrade() -> None:
    op.drop_index("ix_audit_logs_entity", table_name="audit_logs")
    op.drop_index("ix_audit_logs_user_created", table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_table("imports")
    op.drop_table("purchase_order_items")
    op.drop_table("purchase_orders")
    op.drop_table("supplier_prices")
    op.drop_table("suppliers")
    op.drop_table("product_aliases")
    op.drop_table("products")
    op.drop_table("users")
    sa.Enum(name="audit_action").drop(op.get_bind(), checkfirst=False)
    sa.Enum(name="import_type").drop(op.get_bind(), checkfirst=False)
    sa.Enum(name="import_status").drop(op.get_bind(), checkfirst=False)
    sa.Enum(name="order_status").drop(op.get_bind(), checkfirst=False)
    sa.Enum(name="price_source").drop(op.get_bind(), checkfirst=False)
    sa.Enum(name="unit_of_measure").drop(op.get_bind(), checkfirst=False)
    sa.Enum(name="product_status").drop(op.get_bind(), checkfirst=False)
    sa.Enum(name="user_role").drop(op.get_bind(), checkfirst=False)
