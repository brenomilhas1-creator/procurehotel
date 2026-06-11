"""
Endpoints de auth relacionados com o user local.

NOTA: O login é feito no FRONTEND via supabase-js (supabase.auth.signInWithPassword).
O backend apenas expõe /me para confirmar o token e devolver o perfil local.

Modo legacy self-hosted mantém /login e /register para ambientes offline.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AdminUser, CurrentUser, audit
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_legacy_token,
    hash_password,
    verify_password,
)
from app.core.supabase_admin import get_supabase_admin
from app.models import AuditAction, User, UserRole
from app.schemas.auth import LoginRequest, TokenPair, UserCreate, UserOut

router = APIRouter()


def _issue_pair(user: User) -> TokenPair:
    access = create_access_token(user.id, extra_claims={"role": user.role.value, "email": user.email})
    refresh = create_refresh_token(user.id) if not settings.use_supabase_auth else access
    return TokenPair(
        access_token=access,
        refresh_token=refresh,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60,
    )


# ---------- /me ----------


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser):
    return user


# ---------- Admin helper (Supabase): convidar utilizador ----------


@router.post("/admin/invite", response_model=UserOut, status_code=201)
async def admin_invite(
    body: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin: AdminUser,
):
    """Convida um novo utilizador via Supabase Auth (cria auth user + magic link)."""
    if not settings.use_supabase_auth:
        raise HTTPException(status_code=400, detail="Supabase não configurado")
    sb = get_supabase_admin()
    if sb is None:
        raise HTTPException(status_code=503, detail="Cliente Supabase indisponível")
    try:
        sb.auth.admin.create_user({
            "email": body.email,
            "email_confirm": True,
            "user_metadata": {"full_name": body.full_name, "role": body.role},
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Supabase: {e}")

    # Sync local
    from app.services.user_sync import fetch_supabase_user_meta, get_or_create_local_user
    meta = await fetch_supabase_user_meta("") or {}
    # Se não temos ID aqui, listamos e procuramos por email
    if not meta.get("id"):
        try:
            page = sb.auth.admin.list_users(page=1, per_page=50)
            for u in getattr(page, "users", []) or []:
                if getattr(u, "email", None) == body.email:
                    meta = {"id": getattr(u, "id", None), "email": body.email}
                    break
        except Exception:
            pass

    user = await get_or_create_local_user(
        db,
        supabase_user_id=meta.get("id") or "",
        email=body.email,
        full_name=body.full_name,
    )
    if user is None:
        raise HTTPException(status_code=500, detail="Falha ao sincronizar user local")
    return user


# ---------- Legacy self-hosted (só ativo se NÃO usar Supabase) ----------


@router.post("/login", response_model=TokenPair)
async def legacy_login(
    body: LoginRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if settings.use_supabase_auth:
        raise HTTPException(
            status_code=410,
            detail="Login migrado para Supabase Auth (use supabase-js no frontend)",
        )
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email ou password inválidos")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Conta desativada")
    user.last_login_at = datetime.now(tz=timezone.utc)
    await audit(db, user, AuditAction.LOGIN, "User", user.id, request=request)
    await db.commit()
    return _issue_pair(user)


@router.post("/refresh", response_model=TokenPair)
async def legacy_refresh(
    db: Annotated[AsyncSession, Depends(get_db)],
    body: dict,
):
    if settings.use_supabase_auth:
        raise HTTPException(status_code=410, detail="Refresh gerido pelo Supabase")
    token = body.get("refresh_token")
    if not token:
        raise HTTPException(status_code=400, detail="refresh_token em falta")
    payload = decode_legacy_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token inválido")
    user = await db.get(User, UUID(payload["sub"]))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Utilizador inválido")
    return _issue_pair(user)


@router.post("/register", response_model=UserOut, status_code=201)
async def legacy_register(
    body: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if settings.use_supabase_auth:
        raise HTTPException(
            status_code=410,
            detail="Registo via Supabase Auth (Authentication → Users → Add user)",
        )
    if (await db.execute(select(User).where(User.email == body.email))).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email já registado")
    existing_admin = (await db.execute(select(User).where(User.role == UserRole.ADMIN).limit(1))).scalar_one_or_none()
    if existing_admin:
        raise HTTPException(status_code=403, detail="Registo público desativado")
    user = User(
        email=body.email,
        full_name=body.full_name,
        hashed_password=hash_password(body.password),
        role=UserRole(body.role) if body.role in {r.value for r in UserRole} else UserRole.ADMIN,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
