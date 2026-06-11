"""
Dependencies partilhadas: DB session, current user, role guard.

Modo Supabase: token Supabase → JWKS verify → get_or_create local user
Modo legacy: HS256 com secret próprio
"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    decode_legacy_token,
    verify_supabase_token_async,
)
from app.models import User, UserRole, AuditLog, AuditAction
from app.services.user_sync import get_or_create_local_user

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="ignored", auto_error=False)


async def get_current_user(
    request: Request,
    token: Annotated[str | None, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exc

    # Suporta ambos: token Supabase (Bearer eyJ...) ou token próprio (Bearer eyJ...)
    # O header `apikey` que o supabase-js envia no RLS é ignorado pelo FastAPI
    try:
        if settings.use_supabase_auth:
            payload = await verify_supabase_token_async(token)
            sub = payload.get("sub")
            email = payload.get("email")
            # full_name pode vir em user_metadata
            meta = payload.get("user_metadata") or {}
            full_name = meta.get("full_name") or meta.get("name")
            if not sub:
                raise credentials_exc
            user = await get_or_create_local_user(
                db,
                supabase_user_id=sub,
                email=email or "",
                full_name=full_name,
            )
            if not user or not user.is_active:
                raise credentials_exc
            await db.commit()
        else:
            # Modo legacy HS256
            payload = decode_legacy_token(token)
            sub = payload.get("sub")
            if not sub:
                raise credentials_exc
            try:
                uid = UUID(sub)
            except (TypeError, ValueError):
                raise credentials_exc
            res = await db.execute(select(User).where(User.id == uid))
            user = res.scalar_one_or_none()
            if not user or not user.is_active:
                raise credentials_exc
    except ValueError:
        raise credentials_exc

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


async def require_admin(user: CurrentUser) -> User:
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas ADMIN pode realizar esta ação",
        )
    return user


AdminUser = Annotated[User, Depends(require_admin)]


async def audit(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: CurrentUser,
    action: AuditAction,
    entity_type: str,
    entity_id: UUID | None = None,
    payload: dict | None = None,
    request: Request | None = None,
) -> AuditLog:
    ip = None
    ua = None
    if request is not None:
        ip = request.client.host if request.client else None
        ua = request.headers.get("user-agent")
    log = AuditLog(
        user_id=user.id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        payload=payload,
        ip_address=ip,
        user_agent=ua,
    )
    db.add(log)
    await db.flush()
    return log
