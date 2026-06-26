-- Fix definitivo: triangulação (2026-06-26)

BEGIN;

DROP FUNCTION IF EXISTS match_invoice_line_to_po(uuid);

CREATE OR REPLACE FUNCTION match_invoice_line_to_po(p_line_id uuid)
RETURNS TABLE(ok boolean, po_line_id uuid, confidence numeric, message text) AS $$
DECLARE
  v_line invoice_lines%ROWTYPE;
  v_invoice invoices%ROWTYPE;
  v_po_line purchase_order_items%ROWTYPE;
  v_confidence numeric(3,2) := 0::numeric;
BEGIN
  SELECT * INTO v_line FROM invoice_lines WHERE id = p_line_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, 0::numeric, 'Linha não encontrada'::text;
    RETURN;
  END IF;
  IF v_line.product_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, 0::numeric, 'Linha sem product_id (precisa match com catálogo primeiro)'::text;
    RETURN;
  END IF;
  SELECT * INTO v_invoice FROM invoices WHERE id = v_line.invoice_id;

  -- Estratégia 1: match exato (mesmo supplier + mesmo product + qty similar ±20%)
  SELECT poi.* INTO v_po_line
  FROM purchase_order_items poi
  JOIN purchase_orders po ON po.id = poi.order_id
  WHERE po.supplier_id = v_invoice.supplier_id
    AND poi.product_id = v_line.product_id
    AND ABS(poi.quantity - v_line.quantity) / NULLIF(poi.quantity, 0) <= 0.20
  ORDER BY ABS(poi.quantity - v_line.quantity) ASC
  LIMIT 1;

  IF FOUND THEN
    v_confidence := 0.85::numeric;
    IF v_po_line.unit_price IS NOT NULL AND v_line.unit_price IS NOT NULL AND v_po_line.unit_price > 0
       AND ABS(v_po_line.unit_price - v_line.unit_price) / v_po_line.unit_price <= 0.10 THEN
      v_confidence := 0.95::numeric;
    END IF;
    UPDATE invoice_lines
    SET po_line_id = v_po_line.id,
        match_status = (CASE WHEN v_confidence >= 0.9 THEN 'auto_matched' ELSE 'manual_matched' END)::match_status,
        match_confidence = v_confidence,
        matched_at = now()
    WHERE id = p_line_id;
    RETURN QUERY SELECT true, v_po_line.id, v_confidence, 'Matched com PO';
  ELSE
    RETURN QUERY SELECT false, NULL::uuid, 0::numeric, 'Nenhuma PO encontrada';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Trigger
DROP TRIGGER IF EXISTS trg_auto_match_invoice_line ON invoice_lines;

-- Re-rodar match para TODAS
DO $$
DECLARE
  rec RECORD;
  matched_count INT := 0;
  failed_count INT := 0;
  v_msg text;
BEGIN
  FOR rec IN
    SELECT id FROM invoice_lines
    WHERE product_id IS NOT NULL AND po_line_id IS NULL
  LOOP
    BEGIN
      SELECT message INTO v_msg FROM match_invoice_line_to_po(rec.id);
      IF v_msg = 'Matched com PO' THEN
        matched_count := matched_count + 1;
      ELSE
        failed_count := failed_count + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      failed_count := failed_count + 1;
      RAISE NOTICE 'Falha em %: %', rec.id, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'Re-match completo: % sucessos, % falhas', matched_count, failed_count;
END $$;

COMMIT;
