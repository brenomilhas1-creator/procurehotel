-- Migration: stock (2026-06-24)
-- Adiciona gestão de stock: atual, mínimo, ponto de encomenda
-- Decisão: usar colunas na própria tabela products (mais simples que nova tabela)
-- 1 linha por produto com stock=0 se não tiver

BEGIN;

-- Adicionar colunas de stock à tabela products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock_quantity NUMERIC(10, 3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_min NUMERIC(10, 3) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stock_reorder_point NUMERIC(10, 3) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stock_unit TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stock_location TEXT DEFAULT 'main',
  ADD COLUMN IF NOT EXISTS stock_last_counted_at TIMESTAMPTZ DEFAULT NULL;

-- View: stock crítico (produtos abaixo do mínimo)
CREATE OR REPLACE VIEW low_stock_products AS
SELECT
  p.id,
  p.master_name,
  p.brand,
  p.category,
  p.stock_quantity,
  p.stock_min,
  p.stock_reorder_point,
  p.stock_unit,
  p.stock_location,
  CASE
    WHEN p.stock_min IS NOT NULL AND p.stock_quantity <= p.stock_min THEN 'critical'
    WHEN p.stock_reorder_point IS NOT NULL AND p.stock_quantity <= p.stock_reorder_point THEN 'low'
    ELSE 'ok'
  END AS stock_status
FROM products p
WHERE p.is_active = true
  AND p.stock_min IS NOT NULL
  AND p.stock_quantity <= p.stock_min;

-- RLS para a view (via security_invoker)
ALTER VIEW low_stock_products SET (security_invoker = true);

-- Índices para queries frequentes
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity) WHERE stock_quantity IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_stock_min ON products(stock_min) WHERE stock_min IS NOT NULL;

COMMIT;
