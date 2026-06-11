"""
Modelo: User + Role.
Suporta dois modos:
  - self-hosted: email + hashed_password local
  - supabase: email + supabase_user_id (UUID do auth.users)
"""

from __future__ import annotations

import enum
import uuid

from sqlalchemy import String, Boolean, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import UUIDPrimaryKeyMixin, TimestampMixin


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    # UUID do Supabase Auth (auth.users.id) — null no modo self-hosted
    supabase_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), unique=True, nullable=True, index=True
    )
    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role", values_callable=lambda x: [e.value for e in x]),
        default=UserRole.USER,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # tenant_id permite escalar para multiempresa (Fase 3)
    tenant_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    last_login_at: Mapped[object | None] = mapped_column(nullable=True)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<User {self.email} role={self.role.value}>"

    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN
