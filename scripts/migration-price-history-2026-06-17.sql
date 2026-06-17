-- Migration: supplier_price_history (2026-06-17)
-- Adiciona tabela para guardar histórico de preços (UPSERT em supplier_prices perde histórico)
-- Necessário para mostrar tendência (subiu/desceu) no Pedido Rápido.

BEGIN;

CREATE TABLE IF NOT EXISTS supplier_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  unit_price NUMERIC(10, 4) NOT NULL,
  price NUMERIC(10, 4) NOT NULL,
  source TEXT,
  source_ref TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sph_product_recorded 
  ON supplier_price_history(product_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_sph_supplier_product 
  ON supplier_price_history(supplier_id, product_id, recorded_at DESC);

ALTER TABLE supplier_price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sp_history_authenticated ON supplier_price_history;
CREATE POLICY sp_history_authenticated ON supplier_price_history
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger para inserir automaticamente em supplier_price_history
-- quando supplier_prices sofre UPSERT (atualização de preço).
CREATE OR REPLACE FUNCTION log_supplier_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.unit_price IS DISTINCT FROM NEW.unit_price) THEN
    INSERT INTO supplier_price_history (supplier_id, product_id, unit_price, price, source, source_ref, recorded_at)
    VALUES (NEW.supplier_id, NEW.product_id, OLD.unit_price, OLD.price, OLD.source, OLD.source_ref, now());
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO supplier_price_history (supplier_id, product_id, unit_price, price, source, source_ref, recorded_at)
    VALUES (NEW.supplier_id, NEW.product_id, NEW.unit_price, NEW.price, NEW.source, NEW.source_ref, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_supplier_price_change ON supplier_prices;
CREATE TRIGGER trg_log_supplier_price_change
  AFTER INSERT OR UPDATE ON supplier_prices
  FOR EACH ROW
  EXECUTE FUNCTION log_supplier_price_change();

COMMIT;
