# API Reference — ProcureHotel v0.1

Base URL: `http://localhost:8000/api/v1`
OpenAPI/Swagger: <http://localhost:8000/docs>
ReDoc: <http://localhost:8000/redoc>

Autenticação: `Authorization: Bearer <access_token>` em todos os endpoints `/auth/me`, `/products`, `/suppliers`, etc.

## Auth

### `POST /auth/login`
```json
{ "email": "admin@procurehotel.pt", "password": "admin12345" }
```
→ `200 { access_token, refresh_token, token_type: "bearer", expires_in: 3600 }`

### `POST /auth/refresh`
```json
{ "refresh_token": "..." }
```

### `POST /auth/register` (público, só se não existir ADMIN)
```json
{ "email": "...", "full_name": "...", "password": "...", "role": "admin" }
```

### `GET /auth/me` → `User`

## Users (ADMIN)

| Método | Path | Descrição |
| --- | --- | --- |
| `GET` | `/users?q=&page=&size=` | Lista paginada |
| `POST` | `/users` | Cria utilizador |
| `PATCH` | `/users/{id}` | Edita (nome, role, is_active) |
| `DELETE` | `/users/{id}` | Apaga (soft) |

## Products

| Método | Path | Descrição |
| --- | --- | --- |
| `GET` | `/products?q=&category=&brand=&status=&page=&size=` | Pesquisa paginada |
| `GET` | `/products/search?q=` | Top-10 fuzzy (master_name + aliases) |
| `POST` | `/products` | Cria produto (com aliases) |
| `GET` | `/products/{id}` | Detalhe |
| `PATCH` | `/products/{id}` | Edita (status, name, brand, etc.) |
| `DELETE` | `/products/{id}` | Soft delete (is_active=false, status=hidden) |
| `POST` | `/products/{id}/aliases` | Adiciona alias |

## Suppliers

| Método | Path | Descrição |
| --- | --- | --- |
| `GET` | `/suppliers?q=&page=&size=` | Lista |
| `POST` | `/suppliers` | Cria |
| `GET` | `/suppliers/{id}` | Detalhe |
| `PATCH` | `/suppliers/{id}` | Edita |
| `DELETE` | `/suppliers/{id}` | Soft delete |

## Prices

| Método | Path | Descrição |
| --- | --- | --- |
| `GET` | `/prices?supplier_id=&product_id=&page=&size=` | Lista (apenas correntes por defeito) |
| `POST` | `/prices` | Cria/atualiza preço (marca anteriores como !is_current) |
| `GET` | `/prices/compare/{product_id}` | Lista ordenada do melhor para o pior |
| `DELETE` | `/prices/{id}` | Apaga |

## Orders

### `POST /orders/parse`
```json
{ "text": "10 caixas coca cola\n5kg queijo flamengo", "locale": "pt-PT" }
```
→ `200 { items: FreeTextItem[], ambiguous: [...] }`

### `POST /orders/optimize`
```json
{
  "items": [
    { "raw_line": "10 cx coca cola", "quantity": 10, "unit": "cx", "product_name": "Coca Cola 33cl" }
  ]
}
```
→ `200 OrderOptimizeResponse { groups: [...], grand_total, unmatchable: [...] }`

### `POST /orders/commit`
```json
{
  "groups": [
    { "supplier_id": "...", "supplier_name": "...", "items": [...], "total": 123.45, "item_count": 3 }
  ],
  "raw_input": "10 caixas coca cola..."
}
```
→ `201 [PurchaseOrder, ...]`

### `GET /orders?status=&page=&size=` — lista
### `GET /orders/{id}` — detalhe
### `PATCH /orders/{id}` — atualiza status (coloca `placed_at` se `status=placed`)

## Imports

### `POST /imports` (multipart/form-data)
- `file`: PDF/Excel/Word/CSV/imagem
- `supplier_id` (UUID, opcional)
- `import_type`: `price_list` | `invoice` (default `price_list`)
- `auto_normalize`: `true` (default)

### `GET /imports?status=&page=&size=`
### `GET /imports/{id}` (com `extracted_rows` e `normalized_rows`)
### `POST /imports/{id}/normalize` (re-corre normalização IA)
### `POST /imports/{id}/review`
```json
{
  "default_supplier_id": "...",   // se a importação não tiver supplier
  "decisions": [
    { "row_index": 0, "action": "approve" },
    { "row_index": 1, "action": "ignore" },
    { "row_index": 2, "action": "approve", "suggested_name": "Queijo Flamengo", "price": 32.5 }
  ]
}
```

## Analytics

### `GET /analytics/summary`
```json
{
  "monthly_spend": [{ "month": "2026-01", "total": 1234.56, "orders": 12 }, ...],
  "top_products": [{ "product_id": "...", "name": "...", "quantity": 50, "total": 250.0 }, ...],
  "top_suppliers": [{ "supplier_id": "...", "name": "...", "orders": 5, "total": 800.0 }, ...],
  "savings": { "period_days": 30, "actual_spend": 4321.0, "estimated_savings": 0.0 }
}
```

### `GET /analytics/price-variation/{product_id}?days=180`
Devolve série temporal `{ date, unit_price, supplier }`.

## Códigos de erro

| Código | Significado |
| --- | --- |
| `400` | Validação (payload inválido) |
| `401` | Sem token / token inválido |
| `403` | Sem permissão (ex: USER tenta aceder a `/users`) |
| `404` | Recurso não encontrado |
| `409` | Conflito (email/SKU duplicado) |
| `413` | Ficheiro demasiado grande |
| `422` | Erro semântico (ex: OCR falhou) |
| `500` | Erro interno (logado em `audit_logs` se possível) |
