"""
Cliente Supabase para uso server-side (backend FastAPI).

Usa a service_role key (admin total — NUNCA expor ao cliente).
Funcionalidades:
  - Storage (upload/download de ficheiros)
  - Admin Auth (criar/listar/apagar utilizadores)
  - Verificar JWT (delegado a security.py)
"""

from __future__ import annotations

from functools import lru_cache

from loguru import logger
from supabase import Client, create_client

from app.core.config import settings


@lru_cache
def get_supabase_admin() -> Client | None:
    """Devolve cliente Supabase com service_role key (admin)."""
    if not (settings.supabase_url and settings.supabase_service_role_key):
        return None
    try:
        return create_client(settings.supabase_url, settings.supabase_service_role_key)
    except Exception as e:
        logger.error(f"Falha a criar cliente Supabase admin: {e}")
        return None


def get_supabase_anon() -> Client | None:
    """Devolve cliente com anon key (para fluxos que precisam de RLS)."""
    if not (settings.supabase_url and settings.supabase_anon_key):
        return None
    try:
        return create_client(settings.supabase_url, settings.supabase_anon_key)
    except Exception as e:
        logger.error(f"Falha a criar cliente Supabase anon: {e}")
        return None
