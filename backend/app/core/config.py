"""
Configuração central via variáveis de ambiente (Pydantic Settings).

Suporta 2 modos:
  - self-hosted (legacy): DATABASE_URL próprio + JWT_SECRET HS256
  - supabase: SUPABASE_URL + SUPABASE_DB_URL + verificação via JWKS ES256
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Definições carregadas do ambiente / .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---- App ----
    app_env: Literal["development", "staging", "production", "test"] = "development"
    app_name: str = "Compra Facil Hoteis"
    app_version: str = "0.3.0"
    api_v1_prefix: str = "/api/v1"
    backend_cors_origins: list[str] = Field(default_factory=lambda: [
        "http://localhost:3000", "http://127.0.0.1:3000",
    ])

    # ---- Database (Supabase Postgres, ou self-hosted) ----
    database_url: str = "postgresql+psycopg://postgres:postgres@db:5432/postgres"
    db_echo: bool = False
    db_pool_size: int = 10
    db_max_overflow: int = 20

    # ---- Supabase (auth + storage) ----
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwks_url: str = ""
    supabase_storage_bucket: str = "ocr-uploads"
    # Quando true, sincroniza/utilizadores Supabase Auth → tabela local users
    sync_supabase_users: bool = True
    # storage: "supabase" | "local"
    storage_backend: Literal["supabase", "local"] = "supabase"

    # ---- Legacy JWT (self-hosted only) ----
    jwt_secret: str = "change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    # ---- Bcrypt ----
    bcrypt_rounds: int = 12

    # ---- OpenAI ----
    openai_api_key: str = ""
    openai_model: str = "gpt-5.5"
    openai_max_tokens: int = 2048
    openai_temperature: float = 0.1

    # ---- OCR ----
    ocr_engine: Literal["docling", "tesseract"] = "docling"
    tesseract_lang: str = "por+eng"
    ocr_upload_dir: str = "/tmp/procurehotel-uploads"
    max_upload_mb: int = 25

    # ---- i18n ----
    default_locale: str = "pt-PT"

    # ---- Observability ----
    sentry_dsn: str = ""
    enable_metrics: bool = False

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def _split_cors(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @field_validator("bcrypt_rounds")
    @classmethod
    def _bcrypt_range(cls, v: int) -> int:
        if not 4 <= v <= 16:
            raise ValueError("bcrypt_rounds deve estar entre 4 e 16")
        return v

    @property
    def use_supabase_auth(self) -> bool:
        return bool(self.supabase_url and self.supabase_anon_key)

    @property
    def resolved_jwks_url(self) -> str:
        if self.supabase_jwks_url:
            return self.supabase_jwks_url
        if self.supabase_url:
            return f"{self.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        return ""


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
