"""Schemas de autenticação."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import EmailStr, Field

from app.schemas.common import ORMBase


class LoginRequest(ORMBase):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class TokenPair(ORMBase):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # segundos


class UserCreate(ORMBase):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    role: str = "user"


class UserUpdate(ORMBase):
    full_name: str | None = None
    role: str | None = None
    is_active: bool | None = None


class UserOut(ORMBase):
    id: UUID
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    last_login_at: datetime | None = None
