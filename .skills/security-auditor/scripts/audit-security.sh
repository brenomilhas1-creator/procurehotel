#!/bin/bash
# Security Auditor — Auditoria completa de segurança
# Uso: ./audit-security.sh

set -e
DBURL="postgresql://postgres.fpjhvyydavssrzrkvlbd:%23Foguete1000@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
export PGPASSWORD='#Foguete1000'

echo "🔒 AUDITORIA DE SEGURANÇA"
echo "========================="
echo

echo "1. RLS"
psql "$DBURL" -c "
SELECT 'tabelas SEM RLS' AS issue, count(*) AS n
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r' AND n.nspname = 'public' AND NOT c.relrowsecurity;
"

echo "2. user_metadata em policies (editável)"
psql "$DBURL" -c "
SELECT tablename, policyname FROM pg_policies
WHERE qual::text ILIKE '%user_metadata%' OR with_check::text ILIKE '%user_metadata%';
"

echo "3. user_metadata em functions"
psql "$DBURL" -c "
SELECT proname FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.prosrc ILIKE '%user_metadata%' AND n.nspname = 'public';
"

echo "4. Views SECURITY DEFINER (ignoram RLS)"
psql "$DBURL" -c "
SELECT viewname FROM pg_views
WHERE schemaname = 'public'
  AND viewname NOT IN (SELECT viewname FROM pg_views WHERE definition ILIKE '%security_invoker%');
"

echo "5. Policies permissivas (USING true)"
psql "$DBURL" -c "
SELECT tablename, policyname, cmd FROM pg_policies WHERE qual::text = 'true';
"

echo "6. Funções SECURITY DEFINER sem SET search_path (risco SQL injection)"
psql "$DBURL" -c "
SELECT proname FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE prosecdef AND n.nspname = 'public' AND proconfig IS NULL;
"

echo "7. Storage buckets sem policies"
psql "$DBURL" -c "
SELECT name FROM storage.buckets WHERE id NOT IN (SELECT DISTINCT bucket_id FROM storage.objects LIMIT 100);
"

echo "8. Verificar uso de dangerouslySetInnerHTML (XSS risk)"
grep -rn "dangerouslySetInnerHTML" /workspace/frontend/src/ 2>/dev/null || echo "0 ocorrências"

echo "9. Verificar tokens em código"
grep -rnE "sb_secret_[a-zA-Z0-9]{20,}" /workspace/frontend/src/ /workspace/supabase/functions/ 2>/dev/null | grep -v ".env\|.example" || echo "0 segredos hardcoded"

echo "10. Verificar CORS permissivo"
grep -rn "Access-Control-Allow-Origin.*\*" /workspace/supabase/functions/ 2>/dev/null || echo "0 CORS permissivo"

echo
echo "✅ Auditoria de segurança concluída"
