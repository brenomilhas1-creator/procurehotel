-- =====================================================
-- Fix Security Advisor issues (2026-06-16)
-- Compra Facil Hoteis
-- =====================================================
-- O Supabase Advisor identificou 6 issues CRITICAL:
--   1-3) Policies RLS usando auth.jwt() -> 'user_metadata' (editável)
--   4) View usage_summary com SECURITY DEFINER
--   5) View pending_quotes_by_supplier com SECURITY DEFINER
--   6) Falso positivo: comentário em resolve_user_id
--
-- SOLUÇÃO:
--   • Função helper public.current_user_role() — consulta public.users
--   • Policies reescritas para usar a função
--   • Views recriadas com security_invoker = true
--   • Função resolve_user_id limpa (sem user_metadata em código)
-- =====================================================

BEGIN;

-- ====================================================================
-- 1) HELPER FUNCTION: current_user_role()
--    Consulta a tabela public.users em vez de auth.jwt() user_metadata
-- ====================================================================
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.users WHERE supabase_user_id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, anon;

-- ====================================================================
-- 2) RECRIAR POLICIES QUE USAM user_metadata
-- ====================================================================

-- 2.1) favorites.admin read all
DROP POLICY IF EXISTS "favorites admin read all" ON public.favorites;
CREATE POLICY "favorites admin read all"
  ON public.favorites
  FOR SELECT
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- 2.2) usage_events.admin read all
DROP POLICY IF EXISTS "usage events admin read all" ON public.usage_events;
CREATE POLICY "usage events admin read all"
  ON public.usage_events
  FOR SELECT
  TO authenticated
  USING (public.current_user_role() = 'admin');

-- 2.3) storage.objects.ocr-uploads: admin all
DROP POLICY IF EXISTS "ocr-uploads: admin all" ON storage.objects;
CREATE POLICY "ocr-uploads: admin all"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'ocr-uploads' AND public.current_user_role() = 'admin'
  )
  WITH CHECK (
    bucket_id = 'ocr-uploads' AND public.current_user_role() = 'admin'
  );

-- ====================================================================
-- 3) VIEWS: SECURITY DEFINER → SECURITY INVOKER
-- ====================================================================

-- 3.1) usage_summary
DROP VIEW IF EXISTS public.usage_summary CASCADE;
CREATE VIEW public.usage_summary
  WITH (security_invoker = true)
AS
SELECT
  (date_trunc('day'::text, created_at))::date AS day,
  count(*) FILTER (WHERE (event_type = 'login'::text)) AS logins,
  count(*) FILTER (WHERE (event_type = 'order_created'::text)) AS orders_created,
  count(*) FILTER (WHERE (event_type = 'favorite_used'::text)) AS favorites_used,
  count(*) FILTER (WHERE (event_type = 'order_repeated'::text)) AS orders_repeated,
  count(*) FILTER (WHERE (event_type = 'import_uploaded'::text)) AS imports_uploaded,
  count(*) FILTER (WHERE (event_type = 'product_created'::text)) AS products_created,
  count(*) FILTER (WHERE (event_type = 'price_updated'::text)) AS prices_updated,
  count(*) FILTER (WHERE (event_type = 'error'::text)) AS errors,
  avg(duration_ms) FILTER (WHERE (duration_ms IS NOT NULL))::numeric AS avg_duration_ms,
  count(DISTINCT user_id) AS unique_users
FROM usage_events
GROUP BY ((date_trunc('day'::text, created_at))::date)
ORDER BY ((date_trunc('day'::text, created_at))::date) DESC;

-- 3.2) pending_quotes_by_supplier
DROP VIEW IF EXISTS public.pending_quotes_by_supplier CASCADE;
CREATE VIEW public.pending_quotes_by_supplier
  WITH (security_invoker = true)
AS
SELECT
  pq.supplier_id,
  s.name AS supplier_name,
  s.contact_email AS supplier_email,
  s.contact_phone AS supplier_phone,
  count(*) FILTER (WHERE (pq.status = 'pending'::quote_status)) AS pending_count,
  count(*) AS total_count,
  min(pq.created_at) AS oldest_pending,
  max(pq.created_at) AS newest_pending
FROM (pending_quotes pq
  LEFT JOIN suppliers s ON ((s.id = pq.supplier_id)))
GROUP BY pq.supplier_id, s.name, s.contact_email, s.contact_phone;

-- Permissões
GRANT SELECT ON public.usage_summary TO authenticated, anon;
GRANT SELECT ON public.pending_quotes_by_supplier TO authenticated, anon;

-- ====================================================================
-- 4) FUNÇÃO resolve_user_id: limpa (sem user_metadata)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.resolve_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_email text;
BEGIN
  IF NEW.user_id IS NOT NULL AND EXISTS (SELECT 1 FROM users WHERE id = NEW.user_id) THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    SELECT id INTO NEW.user_id
    FROM users
    WHERE supabase_user_id = auth.uid()
    LIMIT 1;

    IF NEW.user_id IS NULL THEN
      v_email := COALESCE(auth.jwt() ->> 'email', 'unknown@example.com');
      INSERT INTO users (id, supabase_user_id, email, full_name, hashed_password, role, is_active)
      VALUES (
        gen_random_uuid(),
        auth.uid(),
        v_email,
        split_part(v_email, '@', 1),
        '!supabase-managed',
        'user'::user_role,
        true
      )
      ON CONFLICT (supabase_user_id) DO NOTHING
      RETURNING id INTO NEW.user_id;

      IF NEW.user_id IS NULL THEN
        SELECT id INTO NEW.user_id FROM users WHERE supabase_user_id = auth.uid() LIMIT 1;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$fn$;

-- ====================================================================
-- 5) VERIFICAÇÃO FINAL
-- ====================================================================
DO $$
BEGIN
  RAISE NOTICE 'user_metadata em policies: %',
    (SELECT count(*) FROM pg_policies
     WHERE qual::text ILIKE '%user_metadata%' OR with_check::text ILIKE '%user_metadata%');
  RAISE NOTICE 'user_metadata em functions: %',
    (SELECT count(*) FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE p.prosrc ILIKE '%user_metadata%' AND n.nspname = 'public');
  RAISE NOTICE 'user_metadata em views: %',
    (SELECT count(*) FROM pg_views
     WHERE schemaname = 'public' AND definition ILIKE '%user_metadata%');
  RAISE NOTICE 'policies com current_user_role: %',
    (SELECT count(*) FROM pg_policies
     WHERE qual::text ILIKE '%current_user_role%' OR with_check::text ILIKE '%current_user_role%');
END $$;

COMMIT;
