"""
Serviço de IA: parsing de texto livre + normalização de linhas OCR.

Usa OpenAI (GPT-5.5). Inclui fallback para parsing determinístico (regex) se a
chave não estiver configurada, para que o sistema continue funcional em
ambientes de desenvolvimento sem API key.
"""

from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from loguru import logger

from app.core.config import settings


# ---------------------------------------------------------------------------
# Modelos de dados
# ---------------------------------------------------------------------------


@dataclass
class ParsedItem:
    raw_line: str
    quantity: float
    unit: str
    product_name: str | None
    brand: str | None
    confidence: float = 0.0
    notes: str | None = None


@dataclass
class NormalizedRow:
    row_index: int
    raw_text: str
    suggested_name: str | None
    brand: str | None
    quantity: float | None
    unit: str | None
    package_size: float | None
    package_unit: str | None
    price: float | None
    currency: str
    ean: str | None
    confidence: float
    product_id: str | None
    action: str = "review"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


_UNIT_MAP = {
    # peso
    "kg": "kg", "quilo": "kg", "quilos": "kg", "kilo": "kg", "kilos": "kg",
    "g": "g", "gr": "g", "grama": "g", "gramas": "g",
    # volume
    "l": "l", "lt": "l", "lts": "l", "litro": "l", "litros": "l",
    "ml": "ml", "mililitro": "ml", "mililitros": "ml",
    # unidades
    "un": "un", "unid": "un", "unidade": "un", "unidades": "un",
    "cx": "cx", "caixa": "cx", "caixas": "cx",
    "pc": "pc", "pct": "pc", "pacote": "pc", "pacotes": "pc",
    "gf": "gf", "garrafa": "gf", "garrafas": "gf",
    "lt": "lt", "lata": "lt", "latas": "lt",
    "sc": "sc", "saco": "sc", "sacos": "sc",
    "dz": "dz", "duzia": "dz", "dúzia": "dz", "duzias": "dz", "dúzias": "dz",
}

_BRANDS_HINT = [
    "coca cola", "coca-cola", "pepsi", "fanta", "sprite", "7up",
    "nestle", "nestlé", "ferrero", "milka", "jacquot", "president",
    "danone", "activa", "mimosa", "galbani", "philadelphia",
    "knorr", "calve", "hellmann", "hellmann's", "lipton", "red bull",
    "carlsberg", "super bock", "sagres", "heineken", "stella",
    "compal", "sumol", "tropicana",
]

_PT_NUM = str.maketrans(",.", ".,")  # normalização simples


def _normalize_text(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower().strip()


def _parse_number(token: str) -> float | None:
    t = token.strip().replace(",", ".").rstrip(".")
    try:
        return float(t)
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Parser determinístico (fallback)
# ---------------------------------------------------------------------------


_LINE_RE = re.compile(
    r"""
    ^\s*
    (?P<qty>\d+(?:[.,]\d+)?)
    \s*
    (?P<unit>\w+)?            # un/ kg/ cx/ lt/ etc
    \s+
    (?P<name>.+?)$
    """,
    re.IGNORECASE | re.VERBOSE,
)


def parse_free_text_fallback(text: str) -> list[ParsedItem]:
    """Parser simples baseado em regex. Suficiente para PT/EN básico."""
    items: list[ParsedItem] = []
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        m = _LINE_RE.match(line)
        if not m:
            # tenta detetar "nome x qtd" como "queijo 2kg"
            continue
        qty = _parse_number(m.group("qty")) or 1.0
        unit_raw = (m.group("unit") or "").lower()
        unit = _UNIT_MAP.get(unit_raw, "un")
        name = m.group("name").strip()
        brand = None
        nlow = _normalize_text(name)
        for b in _BRANDS_HINT:
            if b in nlow:
                brand = b
                break
        items.append(ParsedItem(
            raw_line=line,
            quantity=qty,
            unit=unit,
            product_name=name,
            brand=brand,
            confidence=0.55,
        ))
    return items


# ---------------------------------------------------------------------------
# OpenAI client (parsing livre)
# ---------------------------------------------------------------------------


SYSTEM_PROMPT_PARSE = """Você é um assistente especializado em extrair listas de compras para hotelaria.
Recebe um texto livre em PT-PT (ou PT-BR) e devolve APENAS JSON válido com a estrutura:

{
  "items": [
    {
      "raw_line": "10 caixas coca cola",
      "quantity": 10,
      "unit": "cx",
      "product_name": "Coca Cola Original 33cl",
      "brand": "Coca Cola",
      "confidence": 0.92,
      "notes": null
    }
  ]
}

Regras:
- unit ∈ {un, kg, g, l, ml, cx, pc, gf, lt, sc, dz}
- quantity > 0
- product_name em PT-PT
- brand só se for claramente identificável
- confidence ∈ [0,1]
- Se uma linha for ambígua, devolva-a com confidence < 0.6
"""


SYSTEM_PROMPT_NORMALIZE = """Você é um assistente que normaliza linhas extraídas de faturas / tabelas de preços
de fornecedores de hotelaria. Recebe JSON com {row_index, raw_text, cells: [...]} e devolve
APENAS JSON válido com a estrutura:

{
  "rows": [
    {
      "row_index": 0,
      "raw_text": "...",
      "suggested_name": "Queijo Flamengo",
      "brand": "Presid...",
      "quantity": 1,
      "unit": "kg",
      "package_size": 5,
      "package_unit": "kg",
      "price": 32.5,
      "currency": "EUR",
      "ean": null,
      "confidence": 0.88,
      "product_id": null,
      "action": "review"
    }
  ]
}

Regras:
- action ∈ {"approve", "edit", "ignore"} — usar "edit" se confiança < 0.7
- price > 0 (preço unitário por embalagem, sem IVA se identificável)
- Não invente EANs (devolva null)
- Não invente marcas se não existirem no texto
"""


class AINormalizer:
    """Wrapper do cliente OpenAI com fallback determinístico."""

    def __init__(self) -> None:
        self._client = None
        if settings.openai_api_key:
            try:
                from openai import AsyncOpenAI
                self._client = AsyncOpenAI(api_key=settings.openai_api_key)
            except Exception as e:  # pragma: no cover
                logger.warning(f"OpenAI indisponível: {e}")

    async def parse_free_text(self, text: str) -> list[ParsedItem]:
        if self._client is None:
            return parse_free_text_fallback(text)
        try:
            resp = await self._client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT_PARSE},
                    {"role": "user", "content": text},
                ],
                temperature=settings.openai_temperature,
                max_tokens=settings.openai_max_tokens,
                response_format={"type": "json_object"},
            )
            content = resp.choices[0].message.content or "{}"
            data = json.loads(content)
            return [
                ParsedItem(
                    raw_line=i.get("raw_line", ""),
                    quantity=float(i.get("quantity", 1)),
                    unit=_UNIT_MAP.get((i.get("unit") or "un").lower(), "un"),
                    product_name=i.get("product_name"),
                    brand=i.get("brand"),
                    confidence=float(i.get("confidence", 0.5)),
                    notes=i.get("notes"),
                )
                for i in data.get("items", [])
            ]
        except Exception as e:
            logger.warning(f"Falha na IA, a usar fallback: {e}")
            return parse_free_text_fallback(text)

    async def normalize_ocr_rows(self, rows: list[dict]) -> list[NormalizedRow]:
        if self._client is None:
            return self._fallback_normalize(rows)
        try:
            payload = {"rows": rows}
            resp = await self._client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT_NORMALIZE},
                    {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
                ],
                temperature=settings.openai_temperature,
                max_tokens=settings.openai_max_tokens,
                response_format={"type": "json_object"},
            )
            data = json.loads(resp.choices[0].message.content or "{}")
            return [
                NormalizedRow(
                    row_index=int(r.get("row_index", idx)),
                    raw_text=r.get("raw_text", ""),
                    suggested_name=r.get("suggested_name"),
                    brand=r.get("brand"),
                    quantity=self._safe_float(r.get("quantity")),
                    unit=r.get("unit"),
                    package_size=self._safe_float(r.get("package_size")),
                    package_unit=r.get("package_unit"),
                    price=self._safe_float(r.get("price")),
                    currency=r.get("currency") or "EUR",
                    ean=r.get("ean"),
                    confidence=float(r.get("confidence", 0.5)),
                    product_id=r.get("product_id"),
                    action=r.get("action") or "review",
                )
                for idx, r in enumerate(data.get("rows", []))
            ]
        except Exception as e:
            logger.warning(f"Falha na normalização IA, a usar fallback: {e}")
            return self._fallback_normalize(rows)

    @staticmethod
    def _safe_float(v: Any) -> float | None:
        if v is None or v == "":
            return None
        try:
            return float(v)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _fallback_normalize(rows: list[dict]) -> list[NormalizedRow]:
        out: list[NormalizedRow] = []
        for idx, r in enumerate(rows):
            cells = r.get("cells") or []
            # heurística: tentar achar número grande = preço
            price = None
            for c in cells[::-1]:
                if c is None:
                    continue
                p = _parse_number(str(c))
                if p and p > 0.05:
                    price = p
                    break
            qty = 1.0
            unit = "un"
            name = cells[0] if cells else r.get("raw_text", "")
            out.append(NormalizedRow(
                row_index=idx,
                raw_text=r.get("raw_text", ""),
                suggested_name=str(name).strip() if name else None,
                brand=None,
                quantity=qty,
                unit=unit,
                package_size=None,
                package_unit=None,
                price=price,
                currency="EUR",
                ean=None,
                confidence=0.4,
                product_id=None,
                action="review",
            ))
        return out


ai_normalizer = AINormalizer()
