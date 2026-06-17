"""
Middleware de observabilidade:
  - Request ID por request (X-Request-ID)
  - Latência medida
  - Logging estruturado de cada request (status, duration, path, user)
  - Sentry SDK (se SENTRY_DSN configurado)
"""

from __future__ import annotations

import time
import uuid

from fastapi import Request
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


class ObservabilityMiddleware(BaseHTTPMiddleware):
    """Adiciona X-Request-ID, mede latência, loga estruturadamente."""

    async def dispatch(self, request: Request, call_next):
        req_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:16]
        start = time.perf_counter()
        response: Response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000

        # Header para tracing distribuído
        response.headers["X-Request-ID"] = req_id
        response.headers["X-Response-Time-Ms"] = f"{duration_ms:.1f}"

        # Log estruturado
        logger.bind(
            request_id=req_id,
            method=request.method,
            path=request.url.path,
            status=response.status_code,
            duration_ms=round(duration_ms, 1),
        ).info("request")

        return response


def setup_sentry(dsn: str) -> None:
    """Inicializa Sentry se DSN fornecido."""
    if not dsn:
        return
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

        sentry_sdk.init(
            dsn=dsn,
            traces_sample_rate=0.1,         # 10% das transações
            profiles_sample_rate=0.1,
            environment=__import__("app.core.config", fromlist=["settings"]).settings.app_env,
            integrations=[
                FastApiIntegration(),
                StarletteIntegration(),
                SqlalchemyIntegration(),
            ],
            send_default_pii=False,
        )
        logger.info("Sentry inicializado")
    except ImportError:
        logger.warning("sentry-sdk não instalado; a ignorar DSN")
    except Exception as e:
        logger.error(f"Falha a inicializar Sentry: {e}")


def setup_health_metrics(app) -> None:
    """Endpoint /metrics exposto se habilitado (Prometheus)."""
    try:
        from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
        from starlette.responses import Response as StarletteResponse

        REQUESTS_TOTAL = Counter(
            "ph_requests_total",
            "Total de requests",
            ["method", "endpoint", "status"],
        )
        REQUEST_LATENCY = Histogram(
            "ph_request_duration_seconds",
            "Latência dos requests",
            ["method", "endpoint"],
        )

        @app.get("/metrics", include_in_schema=False)
        async def metrics():
            return StarletteResponse(generate_latest(), media_type=CONTENT_TYPE_LATEST)
    except ImportError:
        pass
