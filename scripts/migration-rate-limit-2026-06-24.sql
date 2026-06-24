-- Migration: rate limiting (2026-06-24)
-- Tabela para tracking de requests por user/função (janela deslizante)

BEGIN;

CREATE TABLE IF NOT EXISTS rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rl_endpoint_time ON rate_limit_log(endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rl_user_time ON rate_limit_log(user_id, endpoint, created_at DESC);

ALTER TABLE rate_limit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rl_service ON rate_limit_log;
CREATE POLICY rl_service ON rate_limit_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Função: limpa logs antigos (> 1 hora)
CREATE OR REPLACE FUNCTION cleanup_rate_limit_log()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_log WHERE created_at < now() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: conta requests na janela
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_window_seconds INT DEFAULT 60,
  p_max_requests INT DEFAULT 10
)
RETURNS TABLE(allowed BOOLEAN, current_count BIGINT, reset_at TIMESTAMPTZ) AS $$
DECLARE
  v_count BIGINT;
  v_oldest TIMESTAMPTZ;
BEGIN
  SELECT COUNT(*), MIN(created_at) INTO v_count, v_oldest
  FROM rate_limit_log
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND created_at > now() - make_interval(secs => p_window_seconds);
  
  IF v_count >= p_max_requests THEN
    RETURN QUERY SELECT false, v_count, v_oldest + make_interval(secs => p_window_seconds);
  ELSE
    INSERT INTO rate_limit_log (user_id, endpoint) VALUES (p_user_id, p_endpoint);
    RETURN QUERY SELECT true, v_count + 1, now() + make_interval(secs => p_window_seconds);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- pg_cron: cleanup a cada 30 min
SELECT cron.schedule(
  'cleanup-rate-limits',
  '*/30 * * * *',
  $$ SELECT cleanup_rate_limit_log(); $$
);

COMMIT;
