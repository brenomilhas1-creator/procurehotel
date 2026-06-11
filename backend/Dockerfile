# =====================================================================
# Compra Facil Hoteis — backend Dockerfile (otimizado Render free)
# =====================================================================
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONUNBUFFERED=1

# Dependências de sistema: tesseract (OCR) + libs nativas mínimas
RUN apt-get update && apt-get install -y --no-install-recommends \
        tesseract-ocr tesseract-ocr-por tesseract-ocr-eng \
        libpq-dev gcc curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar dependências Python em camadas separadas (cache Docker)
# Pin versao do pip para reprodutibilidade
RUN pip install --upgrade "pip>=24" setuptools wheel

# 1) Dependências leves primeiro (camada cacheada)
RUN pip install \
        "fastapi[standard]>=0.115" \
        "uvicorn[standard]>=0.32" \
        "sqlalchemy>=2.0,<3" \
        "psycopg[binary]>=3.2,<4" \
        "alembic>=1.14" \
        "pydantic>=2.5,<3" \
        "pydantic-settings>=2.6" \
        "python-jose[cryptography]>=3.3" \
        "passlib[bcrypt]>=1.7" \
        "bcrypt<4.1" \
        "python-multipart>=0.0.20" \
        "openai>=1.40" \
        "redis>=5.0" \
        "pandas>=2.0" \
        "openpyxl>=3.1" \
        "python-docx>=1.1" \
        "pypdf>=5.0" \
        "pytesseract>=0.3" \
        "pillow>=10.0" \
        "httpx>=0.28" \
        "loguru>=0.7" \
        "tenacity>=8.2" \
        "supabase>=2.0" \
        "cryptography>=43.0"

# NOTA: docling removido — pesado, não compila no Render free (512MB)
# O código tem fallback para tesseract quando docling não está disponível
# Para re-ativar docling: adicionar 'docling' ao pip install acima (requer plano pago Render)

COPY . .

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
