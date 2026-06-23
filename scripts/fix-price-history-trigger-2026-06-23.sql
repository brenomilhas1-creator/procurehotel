-- Fix: trigger trg_log_supplier_price_change estava em falta na DB
-- Recriado em 2026-06-23 durante processamento da fatura Avoneto FT1/8112
-- Sintoma: registos de faturas antigas tinham old_price=null no histórico

BEGIN;

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
