-- Migration: invoice processing queue + cron (2026-06-24)
-- Adiciona fila de processamento automático de faturas via pg_cron + pg_net

BEGIN;

-- 1. Tabela de queue
CREATE TABLE IF NOT EXISTS invoice_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_attachment_id UUID REFERENCES invoice_attachments(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  supplier_tax_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | processing | processed | failed
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ipq_status ON invoice_processing_queue(status, created_at);

ALTER TABLE invoice_processing_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ipq_all ON invoice_processing_queue;
CREATE POLICY ipq_all ON invoice_processing_queue FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Trigger: novo upload → entra na queue
CREATE OR REPLACE FUNCTION enqueue_invoice_attachment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO invoice_processing_queue (invoice_attachment_id, file_path, file_name)
  VALUES (NEW.id, NEW.file_path, NEW.file_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enqueue_invoice ON invoice_attachments;
CREATE TRIGGER trg_enqueue_invoice
  AFTER INSERT ON invoice_attachments
  FOR EACH ROW
  EXECUTE FUNCTION enqueue_invoice_attachment();

-- 3. Ativar extensões
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 4. Função que chama a Edge Function via pg_net (fire-and-forget)
CREATE OR REPLACE FUNCTION invoke_process_invoice()
RETURNS void AS $$
DECLARE
  v_url TEXT;
  v_key TEXT;
  v_request_id BIGINT;
BEGIN
  v_url := current_setting('app.edge_function_url', true);
  v_key := current_setting('app.service_role_key', true);
  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE NOTICE 'Edge function URL/key não configuradas';
    RETURN;
  END IF;

  SELECT net.http_post(
    url := v_url || '/process-invoice-pdf',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object('process_pending', true)
  ) INTO v_request_id;
  RAISE NOTICE 'Triggered process-invoice-pdf: %', v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. pg_cron: corre a cada 15 min
SELECT cron.schedule(
  'process-pending-invoices',
  '*/15 * * * *',  -- a cada 15 min
  $$ SELECT invoke_process_invoice(); $$
);

COMMIT;
