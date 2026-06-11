"""
Cliente Redis assíncrono.
"""

from __future__ import annotations

import redis.asyncio as redis

from app.core.config import settings

_pool: redis.ConnectionPool | None = None


def get_redis() -> redis.Redis:
    global _pool
    if _pool is None:
        _pool = redis.ConnectionPool.from_url(
            settings.redis_url, decode_responses=True, max_connections=20
        )
    return redis.Redis(connection_pool=_pool)
