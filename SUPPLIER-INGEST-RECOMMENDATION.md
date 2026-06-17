# Recomendação: OCR vale a pena para o teu caso?

## Análise baseada no contexto (mercado hoteleiro PT)

Pelos padrões típicos que conheço:

### Como os preços chegam a hotéis de 4-5 estrelas em Portugal

| Canal | % estimado | Custo de processamento atual |
|---|---|---|
| **Email com PDF** (tabela de preços, catálogo) | ~40% | 5-15 min/PDF a transcrever para Excel |
| **Email com Excel/CSV** | ~25% | 0 min (já está editável) |
| **Portal do fornecedor** (download manual) | ~15% | 5-10 min/download + verificar |
| **Vendedor** (papel/foto WhatsApp) | ~10% | 10-20 min a transcrever |
| **Recibo na entrega** (papel físico) | ~5% | 5-10 min |
| **API** | ~5% | Automático |
| **TOTAL não-editável** | **~55-60%** | **~5-10h/mês** |

### Estimativa de poupança com OCR

**Cenário conservador** (5h/mês, €15/h):
- **Poupança**: 5h × €15/h = **€75/mês** (€900/ano)
- **Custo OCR** (Tesseract.js browser): **€0/mês**
- **Custo OCR** (Google Vision): **€1.50 por 1000 imagens** (~$0.0015 por linha)
- **Custo OCR** (OpenAI GPT-4 Vision): **€0.01 por imagem** (~$0.01)
- **Custo Edge Function** (Supabase free): **€0/mês** (500K invokes)
- **Payback**: 1-2 meses

**Cenário otimista** (10h/mês, €20/h):
- **Poupança**: 10h × €20/h = **€200/mês** (€2.400/ano)
- **Payback**: <1 mês

### Quando NÃO vale a pena

- Se **< 1 fornecedor** com atualizações não-digitais
- Se as atualizações são **rara vez** (trimestral)
- Se já tens **funcionário dedicado** a isto
- Se os preços **não mudam** significativamente

### Implementação recomendada (se avançar)

| Camada | Tecnologia | Custo |
|---|---|---|
| **Parser de PDF estruturado** | `pdf-parse` + regex | €0 (Node) |
| **OCR de imagem (foto/foto-PDF)** | Tesseract.js (browser) OU Vision API | €0 - €0.001/imagem |
| **IA para extração inteligente** (campos como "€1.20/un", "10kg", etc.) | Heurística no frontend | €0 |
| **Confiança / revisão** | UI com badges "Revisão necessária" | €0 |
| **Storage** | Supabase Storage (já temos) | €0 |
| **Edge Function de processamento** | Deno (já temos) | €0 |

**Stack total**: 100% free tier.

### Estimativa de tempo de implementação

| Tarefa | Horas |
|---|---|
| Schema (campos: confidence, raw_text, suggested_rows, status) | 1h |
| Upload + Storage | 0.5h (já feito) |
| Edge Function de parsing (PDF + Tesseract para imagens) | 4h |
| UI de revisão linha-a-linha com confiança | 4h |
| Auto-aprovação de alta confiança (>95%) | 2h |
| Mover para supplier_prices (validação) | 1h |
| Notificações quando entra novo upload | 1h |
| **TOTAL** | **~14h** |

## Decisão recomendada

| Se... | Então... |
|---|---|
| **>50% dos preços vêm em PDF/foto** | Avançar com OCR (Fase 4, ~14h) |
| **<30% vem em não-editável** | Ficar só com CSV/Excel (suficiente) |
| **És 1 hotel só com 3 fornecedores** | Skip OCR (overhead > benefício) |
| **És cadeia de hotéis com 30+ fornecedores** | OCR é **essencial** |

## O que fazer AGORA

1. **Lê `SUPPLIER-INGEST-ANALYSIS.md`** — questionário simples
2. **Responde** às 6 perguntas com base na tua realidade
3. **Manda-me** as respostas
4. **Eu analiso** e digo-te o que fazer (avançar OCR, manter CSV, ou misto)
5. **Não faço OCR por default** porque a maioria dos hotéis não precisa

## TL;DR

**Provavelmente vale a pena avançar com OCR** se:
- Tens >5 fornecedores
- Recebes PDFs/fotos com alguma regularidade
- Perderias 5+ horas/semana sem automatizar

**Provavelmente NÃO vale a pena** se:
- A maioria dos teus preços já vem em Excel/CSV
- Tens poucos fornecedores
- As atualizações são raras

**Manda-me as tuas respostas** (mesmo que curtas) e eu faço a conta final + roadmap de implementação.
