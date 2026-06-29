# 🐍 Python Skills para Debug e Escala

> Guia completo para escrever Python escalável e debugável em 2026.
> Usado em: scripts/parsers, scripts/migrations, scripts/audits.

## 🎯 Princípios Fundamentais

### 1. **Type Hints em TUDO**
```python
# ❌ Sem types
def parse_invoice(text, supplier_id):
    rows = text.split('\n')
    return [r for r in rows if r]

# ✅ Com types
def parse_invoice(text: str, supplier_id: str) -> list[dict[str, Any]]:
    rows: list[str] = text.split('\n')
    return [r for r in rows if r]
```

### 2. **Logging estruturado (NÃO print)**
```python
import logging
import sys
from datetime import datetime, timezone

def setup_logging(level: str = "INFO") -> logging.Logger:
    logger = logging.getLogger("compra_facil")
    logger.setLevel(level)
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(
        '{"ts":"%(asctime)s","level":"%(levelname)s","msg":"%(message)s"}'
    ))
    logger.addHandler(handler)
    return logger

logger = setup_logging()

# Uso:
logger.info("parse_started", extra={"file": "avoneto.pdf", "lines": 34})
logger.error("parse_failed", extra={"error": str(e), "file": file_path})
```

### 3. **Retry com Tenacity**
```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

@retry(
    retry=retry_if_exception_type((ConnectionError, TimeoutError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    reraise=True,
)
def fetch_with_retry(url: str) -> dict:
    return requests.get(url, timeout=10).json()
```

### 4. **Context Managers (with statements)**
```python
# ❌ Manual
conn = psycopg2.connect(dsn)
cur = conn.cursor()
try:
    cur.execute(...)
    conn.commit()
finally:
    cur.close()
    conn.close()

# ✅ Context manager
with psycopg2.connect(dsn) as conn:
    with conn.cursor() as cur:
        cur.execute(...)
        conn.commit()
```

### 5. **Dataclasses (mutável vs frozen)**
```python
from dataclasses import dataclass, field
from decimal import Decimal

@dataclass
class InvoiceLine:
    product_id: str
    quantity: Decimal
    unit_price: Decimal
    
    # Validação
    def __post_init__(self):
        if self.quantity <= 0:
            raise ValueError("quantity must be positive")

@dataclass(frozen=True)  # imutável
class Point:
    x: float
    y: float
```

## 📦 Bibliotecas Recomendadas

| Categoria | Lib | Substitui | Porquê |
|---|---|---|---|
| **DB** | `psycopg2-binary` | psycopg2 | Compatível com Pools Supabase |
| **DB Pool** | `psycopg_pool.ConnectionPool` | Manual | Auto-reconnect |
| **Async DB** | `asyncpg` | psycopg2 async | 10x faster |
| **Parser PDF** | `pdfplumber` | PyPDF2 | Extrai tabelas |
| **Parser Excel** | `openpyxl` | pandas write | Mais controlo |
| **Parser CSV** | `polars` | pandas | 10x faster, 0.01ms latency |
| **HTTP** | `httpx` | requests | Async + HTTP/2 |
| **Retry** | `tenacity` | Manual try-loops | Decorator-based |
| **Validation** | `pydantic` | dataclass | Type-aware validation |
| **Config** | `python-decouple` | os.getenv | .env files |
| **Logging** | `loguru` | stdlib logging | Zero-config |
| **Testing** | `pytest` | unittest | Padrão de facto |
| **Mock** | `freezegun` | manual time | Mock de datetime |

## 🏗️ Estrutura Recomendada

```python
#!/usr/bin/env python3
"""
Nome do script — descrição curta.

Usage:
    python script.py --file path --dry-run
"""
import argparse
import logging
import sys
from pathlib import Path
from typing import Iterator
from decimal import Decimal

from psycopg2.extras import execute_values
from pydantic import BaseModel, Field, field_validator

# === Constants ===
DEFAULT_BATCH_SIZE = 500

# === Logger ===
logger = logging.getLogger("compra_facil")

# === Models ===
class InvoiceLine(BaseModel):
    product_id: str
    quantity: Decimal = Field(gt=0)
    unit_price: Decimal = Field(ge=0)
    
    @field_validator('quantity', 'unit_price', mode='before')
    def parse_decimal(cls, v):
        return Decimal(str(v)) if v else Decimal('0')

# === Core ===
def parse_file(path: Path) -> Iterator[InvoiceLine]:
    """Generator que processa linha a linha."""
    with open(path) as f:
        for row in f:
            yield InvoiceLine.model_validate_json(row)

def upsert_batch(conn, lines: list[InvoiceLine], batch_size: int = DEFAULT_BATCH_SIZE):
    """Batch insert com execute_values."""
    with conn.cursor() as cur:
        for i in range(0, len(lines), batch_size):
            batch = lines[i:i+batch_size]
            execute_values(cur,
                "INSERT INTO invoice_lines (product_id, quantity, unit_price) VALUES %s",
                [(l.product_id, l.quantity, l.unit_price) for l in batch]
            )
            conn.commit()
            logger.info(f"batch_committed", extra={"count": len(batch)})

# === CLI ===
def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--file', type=Path, required=True)
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--batch', type=int, default=DEFAULT_BATCH_SIZE)
    args = parser.parse_args()
    
    try:
        lines = list(parse_file(args.file))
        logger.info(f"parsed", extra={"count": len(lines)})
        
        if args.dry_run:
            logger.info("dry_run_mode_no_db_writes")
            return
        
        with psycopg2.connect(os.environ["DATABASE_URL"]) as conn:
            upsert_batch(conn, lines, batch_size=args.batch)
            logger.info("migration_done", extra={"total": len(lines)})
    except Exception as e:
        logger.exception("migration_failed", extra={"file": str(args.file)})
        sys.exit(1)

if __name__ == "__main__":
    main()
```

## 🧪 Testes (pytest + fixtures)

```python
import pytest
from decimal import Decimal
from my_script import parse_line, InvoiceLine

class TestParseLine:
    def test_simple(self):
        result = parse_line("50 Cebola € 0,80")
        assert result.quantity == Decimal('50')
        assert result.product_name == "Cebola"
        assert result.unit_price == Decimal('0.80')
    
    def test_invalid_qty(self):
        with pytest.raises(ValueError, match="quantity"):
            parse_line("0 Cebola")
    
    @pytest.fixture
    def db(self):
        """Conexão DB limpa para testes."""
        import os
        from psycopg2 import connect
        conn = connect(os.environ["TEST_DATABASE_URL"])
        yield conn
        conn.rollback()
        conn.close()
    
    def test_db_insert(self, db):
        with db.cursor() as cur:
            cur.execute("INSERT INTO ...")
            assert cur.rowcount == 1
```

## 🐛 Debug

```python
import pdb; pdb.set_trace()  # Breakpoint
breakpoint()                  # Python 3.7+

# Ou rich para visual
from rich import print
from rich.traceback import install
install(show_locals=True)
```

## 📊 Performance

```python
# Profile com cProfile
python -m cProfile -s cumulative my_script.py

# Memória com memray
pip install memray
memray run my_script.py
memray stats
```

## 🎯 Especificidades para Compra Facil

```python
# Conexão Supabase Pool
import os
from psycopg2.pool import ThreadedConnectionPool

_pool = None
def get_pool():
    global _pool
    if _pool is None:
        _pool = ThreadedConnectionPool(
            minconn=1, maxconn=10,
            dsn=os.environ["DATABASE_URL"]
        )
    return _pool

# Wrapper para usar do pool
@contextmanager
def db_cursor():
    pool = get_pool()
    conn = pool.getconn()
    try:
        with conn.cursor() as cur:
            yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)
```
