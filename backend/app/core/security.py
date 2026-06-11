"""
Segurança:
  - Modo Supabase: valida JWT ES256 via JWKS endpoint do Supabase
  - Modo self-hosted: HS256 com secret próprio (legacy)

Para passwords, mantemos bcrypt (utilizado em scripts de seed).
"""

from __future__ import annotations

import time
from typing import Any

import httpx
from jose import JWTError, jwt
from jose.utils import base64url_decode
from loguru import logger
from passlib.context import CryptContext

from app.core.config import settings


# ---------- Password hashing (apenas para seeds/legacy) ----------

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=settings.bcrypt_rounds,
)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except (ValueError, TypeError):
        return False


# ---------- JWKS cache (Supabase) ----------


class JWKSCache:
    """Cache simples do JWKS do Supabase (refresh a cada 10 min)."""

    def __init__(self, url: str, ttl: int = 600) -> None:
        self.url = url
        self.ttl = ttl
        self._keys: list[dict] = []
        self._fetched_at: float = 0.0

    async def _refresh(self) -> None:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(self.url)
            r.raise_for_status()
            data = r.json()
        self._keys = data.get("keys", [])
        self._fetched_at = time.time()
        logger.debug(f"JWKS refreshed: {len(self._keys)} keys")

    async def get_keys(self) -> list[dict]:
        if not self._keys or (time.time() - self._fetched_at) > self.ttl:
            await self._refresh()
        return self._keys

    async def get_key(self, kid: str) -> dict | None:
        keys = await self.get_keys()
        for k in keys:
            if k.get("kid") == kid:
                return k
        # kid não encontrado → força refresh
        await self._refresh()
        for k in self._keys:
            if k.get("kid") == kid:
                return k
        return None


_jwks_cache: JWKSCache | None = None


def _get_jwks_cache() -> JWKSCache | None:
    global _jwks_cache
    if not settings.use_supabase_auth:
        return None
    if _jwks_cache is None:
        url = settings.resolved_jwks_url
        if not url:
            return None
        _jwks_cache = JWKSCache(url)
    return _jwks_cache


# ---------- Token verification ----------


def _verify_supabase_token(token: str) -> dict[str, Any]:
    """Síncrono: tenta verificar; se precisar refresh do JWKS, o caller usa a async."""
    cache = _get_jwks_cache()
    if cache is None:
        raise ValueError("Supabase não configurado")

    # Decodifica header sem validar (para extrair kid)
    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError as e:
        raise ValueError(f"Token inválido: {e}")

    kid = unverified_header.get("kid")
    if not kid:
        raise ValueError("Token sem kid")

    # Tenta primeiro com cache; se falhar, força refresh
    keys = cache._keys or []  # type: ignore[attr-defined]
    key = next((k for k in keys if k.get("kid") == kid), None)
    if key is None:
        # JWKS não carregado em modo síncrono; pedimos refresh via asyncio.run
        import asyncio
        asyncio.run(cache._refresh())  # type: ignore[attr-defined]
        key = next((k for k in cache._keys if k.get("kid") == kid), None)  # type: ignore[attr-defined]
    if key is None:
        raise ValueError(f"Signing key {kid} não encontrada no JWKS")

    public_key = _jwk_to_pem(key)
    try:
        return jwt.decode(
            token,
            public_key,
            algorithms=[key.get("alg", "ES256")],
            audience=None,
            options={"verify_aud": False},
        )
    except JWTError as e:
        raise ValueError(f"Token inválido: {e}")


async def verify_supabase_token_async(token: str) -> dict[str, Any]:
    """Async: preferida — usa JWKS cache com refresh assíncrono."""
    cache = _get_jwks_cache()
    if cache is None:
        raise ValueError("Supabase não configurado")

    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError as e:
        raise ValueError(f"Token inválido: {e}")

    kid = unverified_header.get("kid")
    if not kid:
        raise ValueError("Token sem kid")

    key = await cache.get_key(kid)
    if key is None:
        raise ValueError(f"Signing key {kid} não encontrada no JWKS")

    public_key = _jwk_to_pem(key)
    try:
        return jwt.decode(
            token,
            public_key,
            algorithms=[key.get("alg", "ES256")],
            audience=None,
            options={"verify_aud": False},
        )
    except JWTError as e:
        raise ValueError(f"Token inválido: {e}")


def _jwk_to_pem(jwk: dict) -> str:
    """Converte uma JWK EC (P-256) num PEM público."""
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import ec

    if jwk.get("kty") != "EC":
        raise ValueError("Apenas EC keys suportadas")

    x = base64url_decode(jwk["x"].encode("ascii"))
    y = base64url_decode(jwk["y"].encode("ascii"))

    # Construir o ponto público EC em formato DER
    numbers = ec.EllipticCurvePublicNumbers(
        x=int.from_bytes(x, "big"),
        y=int.from_bytes(y, "big"),
        curve=ec.SECP256R1(),
    )
    pubkey = numbers.public_key()
    return pubkey.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("ascii")


# ---------- Legacy HS256 (self-hosted) ----------


def create_access_token(subject: str | int, *, extra_claims: dict | None = None) -> str:
    import secrets
    from datetime import datetime, timedelta, timezone

    now = datetime.now(tz=timezone.utc)
    payload = {
        "sub": str(subject),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.access_token_expire_minutes)).timestamp()),
        "type": "access",
        "jti": secrets.token_urlsafe(16),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_legacy_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as e:
        raise ValueError(f"Token inválido: {e}")
