-- Fix: audit findings (2026-06-24)
-- 1. SET search_path em funções SECURITY DEFINER sem
-- 2. DELETE aliases TEST001/TEST002 órfãos
-- 3. Verificar triggers em supplier_prices

BEGIN;

-- 1. Search path
ALTER FUNCTION public.cleanup_rate_limit_log() SET search_path = public, pg_temp;
ALTER FUNCTION public.enqueue_invoice_attachment() SET search_path = public, pg_temp;
ALTER FUNCTION public.invoke_process_invoice() SET search_path = public, pg_temp;
ALTER FUNCTION public.check_rate_limit(uuid, text, integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.create_product_with_category(text, text, text, text, numeric) SET search_path = public, pg_temp;

-- 2. Aliases órfãos (já não há produtos com estes, mas há aliases)
-- Verificar primeiro
DO $$
DECLARE
  orphan_count INT;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM product_aliases a
  LEFT JOIN products p ON p.id = a.product_id
  WHERE p.id IS NULL OR NOT p.is_active;
  RAISE NOTICE 'Aliases órfãos antes: %', orphan_count;
END $$;

DELETE FROM product_aliases WHERE alias IN ('TEST001', 'TEST002');

-- 3. Verificar triggers em supplier_prices
DO $$
DECLARE
  trig_count INT;
BEGIN
  SELECT COUNT(*) INTO trig_count
  FROM information_schema.triggers
  WHERE event_object_table = 'supplier_prices' AND trigger_schema = 'public';
  RAISE NOTICE 'Triggers em supplier_prices: %', trig_count;
END $$;

COMMIT;
