"""
Sincronização entre Supabase Auth (auth.users) e a tabela local `users`.

Estratégia:
  - Ao receber um token Supabase válido, extraímos o `sub` (= UUID Supabase) e o email
  - Procuramos na tabela `users` por `supabase_user_id`
  - Se não existir, criamos automaticamente com role=USER
  - Se existir, devolvemos o User local

Isto permite ter RLS no Supabase (gestão de permissões) e ao mesmo tempo
dados de negócio (role ADMIN/USER, is_active) na nossa tabela.
"""

from __future__ import annotations

from uuid import UUID

from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.supabase_admin import get_supabase_admin
from app.models import User, UserRole


async def get_or_create_local_user(
    db: AsyncSession,
    *,
    supabase_user_id: str,
    email: str,
    full_name: str | None = None,
) -> User | None:
    """Devolve o User local associado ao Supabase user, criando se necessário."""
    try:
        uid = UUID(supabase_user_id)
    except (TypeError, ValueError):
        logger.warning(f"sub inválido do Supabase: {supabase_user_id}")
        return None

    res = await db.execute(select(User).where(User.supabase_user_id == uid))
    user = res.scalar_one_or_none()

    if user is not None:
        # Atualizar email/nome se mudaram no Supabase
        if email and user.email != email:
            user.email = email
        if full_name and user.full_name != full_name:
            user.full_name = full_name
        await db.flush()
        return user

    # Criar novo
    if not email:
        logger.warning("Sem email — não posso criar user local")
        return None

    # Primeiro user → ADMIN, resto USER
    count = (await db.execute(select(User.id).limit(1))).first()
    role = UserRole.ADMIN if count is None else UserRole.USER

    user = User(
        supabase_user_id=uid,
        email=email,
        full_name=full_name or email.split("@")[0],
        role=role,
        is_active=True,
        # hashed_password vazio — nunca usamos password local
        hashed_password="!supabase-managed",
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    logger.info(f"User local criado: {email} (role={role.value})")
    return user


async def fetch_supabase_user_meta(supabase_user_id: str) -> dict | None:
    """Busca dados atualizados do utilizador no Supabase (admin)."""
    admin = get_supabase_admin()
    if admin is None:
        return None
    try:
        resp = admin.auth.admin.get_user_by_id(supabase_user_id)
        u = getattr(resp, "user", None) or resp
        if u is None:
            return None
        return {
            "id": getattr(u, "id", supabase_user_id),
            "email": getattr(u, "email", None),
            "full_name": (getattr(u, "user_metadata", None) or {}).get("full_name"),
            "role": (getattr(u, "app_metadata", None) or {}).get("role"),
        }
    except Exception as e:
        logger.warning(f"Falha a ler Supabase user: {e}")
        return None
