"""
ProcureHotel — FastAPI app entrypoint.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import api_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.observability import ObservabilityMiddleware, setup_sentry, setup_health_metrics
from app.core.hardening import SecurityHeadersMiddleware, RateLimitMiddleware


@asynccontextmanager
async def lifespan(_: FastAPI):
    setup_logging()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Sistema Inteligente de Compras para Hotelaria — API REST. "
        "Documentação interativa disponível em /docs (Swagger) e /redoc."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS first
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Observability (X-Request-ID, latency, logging estruturado)
app.add_middleware(ObservabilityMiddleware)

# Security headers (CSP, HSTS, X-Frame-Options, etc.)
app.add_middleware(SecurityHeadersMiddleware)

# Rate limiting (100/min default, 10/min para auth)
app.add_middleware(RateLimitMiddleware, requests_per_minute=100, auth_per_minute=10)

# Sentry (se SENTRY_DSN configurado)
if hasattr(settings, 'sentry_dsn'):
    setup_sentry(settings.sentry_dsn)  # type: ignore

# /metrics para Prometheus
setup_health_metrics(app)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "app": settings.app_name, "version": settings.app_version}


@app.get("/", include_in_schema=False)
async def root():
    return JSONResponse(
        {
            "name": settings.app_name,
            "version": settings.app_version,
            "api": settings.api_v1_prefix,
            "docs": "/docs",
        }
    )


app.include_router(api_router, prefix=settings.api_v1_prefix)
