"""Users admin endpoints."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AdminUser, CurrentUser, audit
from app.core.database import get_db
from app.core.security import hash_password
from app.models import AuditAction, User, UserRole
from app.schemas.auth import UserCreate, UserOut, UserUpdate
from app.schemas.common import Page

router = APIRouter()


@router.get("", response_model=Page[UserOut])
async def list_users(
    _: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    q: str | None = None,
):
    base = select(User)
    if q:
        base = base.where(
            (User.email.ilike(f"%{q}%")) | (User.full_name.ilike(f"%{q}%"))
        )
    total = (
        await db.execute(select(func.count()).select_from(base.subquery()))
    ).scalar_one()
    rows = (
        await db.execute(base.order_by(User.created_at.desc()).offset((page - 1) * size).limit(size))
    ).scalars().all()
    return Page(items=[UserOut.model_validate(r) for r in rows], total=total, page=page, size=size,
                pages=(total + size - 1) // size)


@router.post("", response_model=UserOut, status_code=201)
async def create_user(
    body: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: AdminUser,
):
    if (
        await db.execute(select(User).where(User.email == body.email))
    ).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email já existe")
    user = User(
        email=body.email,
        full_name=body.full_name,
        hashed_password=hash_password(body.password),
        role=UserRole(body.role),
    )
    db.add(user)
    await db.flush()
    await audit(db, admin, AuditAction.CREATE, "User", user.id, payload={"email": body.email})
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: UUID,
    body: UserUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: AdminUser,
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    data = body.model_dump(exclude_unset=True)
    if "role" in data:
        user.role = UserRole(data.pop("role"))
    for k, v in data.items():
        setattr(user, k, v)
    await audit(db, admin, AuditAction.UPDATE, "User", user.id, payload=data)
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: AdminUser,
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Não pode apagar-se a si próprio")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    await audit(db, admin, AuditAction.DELETE, "User", user.id)
    await db.delete(user)
    await db.commit()
