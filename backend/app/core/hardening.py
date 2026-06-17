"""
Hardening middleware:
  - Security headers (CSP, HSTS, X-Frame-Options, etc.)
  - Rate limiting por IP
"""

from __future__ import annotations

import time
from collections import defaultdict
from typing import Awaitable, Callable

from fastapi import Request, Response
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware


# ---------- Security Headers ----------

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    # CSP: permite self, inline (Next.js precisa), Supabase, Sentry se configurado
    "Content-Security-Policy": (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co; "
        "frame-ancestors 'none'; "
        "form-action 'self';"
    ),
}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        response = await call_next(request)
        for k, v in SECURITY_HEADERS.items():
            response.headers.setdefault(k, v)
        return response


# ---------- Rate Limiting (in-memory) ----------


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limit simples in-memory por IP. Para produção usar Redis.
    Defaults: 100 req/min para /api/*, 10 req/min para /auth/*.
    """

    def __init__(self, app, requests_per_minute: int = 100, auth_per_minute: int = 10):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.auth_per_minute = auth_per_minute
        self._buckets: dict[str, list[float]] = defaultdict(list)

    def _get_limit(self, path: str) -> int:
        if path.startswith("/api/v1/auth") or path.startswith("/api/v1/admin"):
            return self.auth_per_minute
        return self.requests_per_minute

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        # Identifica o "client" (IP)
        client = request.client
        ip = client.host if client else "unknown"
        # Forwarded for (se houver proxy)
        fwd = request.headers.get("X-Forwarded-For")
        if fwd:
            ip = fwd.split(",")[0].strip()

        # Skip rate limit em rotas não-API
        if not request.url.path.startswith("/api"):
            return await call_next(request)

        # Health checks são excluded
        if request.url.path in ("/health", "/metrics", "/"):
            return await call_next(request)

        now = time.time()
        window = 60.0
        limit = self._get_limit(request.url.path)
        bucket = self._buckets[ip]
        # Limpar entradas antigas
        bucket[:] = [t for t in bucket if now - t < window]
        if len(bucket) >= limit:
            logger.warning(f"rate limit exceeded: {ip} {request.url.path}")
            from starlette.responses import JSONResponse
            return JSONResponse(
                {"detail": "Rate limit exceeded"},
                status_code=429,
                headers={"Retry-After": str(int(window))},
            )
        bucket.append(now)
        return await call_next(request)


# ---------- Slow down (brute force protection) ----------


def check_brute_force(email: str, ip: str, max_attempts: int = 5, lockout_seconds: int = 900) -> bool:
    """
    Verifica se o IP/email deve ser bloqueado por tentativas falhadas.
    (Stub — implementação real precisa de Redis ou tabela de tentativas.)
    """
    # TODO: implementar com Redis em produção
    return False
