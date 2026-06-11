"""
Setup da base de dados SQLAlchemy 2.x assíncrono.

Liga-se ao Supabase Postgres se `SUPABASE_DB_URL` ou `DATABASE_URL` apontar
para lá. Usa SSL obrigatório (Supabase exige).
"""

from __future__ import annotations

import ssl
from collections.abc import AsyncGenerator
from typing import Any

from loguru import logger
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import MetaData

from app.core.config import settings


NAMING_CONVENTION: dict[str, str] = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=NAMING_CONVENTION)


class Base(DeclarativeBase):
    metadata = metadata
    type_annotation_map: dict[Any, Any] = {}


# SSL context partilhado (Supabase exige)
_ssl_ctx = ssl.create_default_context()


def _build_engine_url() -> str:
    url = settings.database_url
    # Se a URL não tem ?sslmode=REQUIRED e vem de Supabase, adicionamos
    if "supabase" in url and "sslmode" not in url and "ssl=" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}sslmode=require"
    return url


engine = create_async_engine(
    _build_engine_url(),
    echo=settings.db_echo,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_pre_ping=True,
    future=True,
    connect_args={"ssl": _ssl_ctx} if "supabase" in settings.database_url else {},
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    from app.models import (  # noqa: F401
        user, product, supplier, price, order, import_, audit,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("init_db: tabelas verificadas")
