/**
 * Inicializa o RAG com documentação chave.
 * Aplica-se ao buildtime e cria um mini-rag-store.json.
 */
import { MiniRAG } from '../frontend/src/lib/mini-rag';

const rag = new MiniRAG();

// Adicionar documentos core sobre o sistema
const docs = [
  {
    id: 'arch-overview',
    title: 'Arquitetura do Sistema Compra Facil Hoteis',
    category: 'architecture',
    tags: ['architecture', 'overview'],
    text: `
      Sistema de procurement intelligence para hoteis. 
      Stack: Next.js 14 App Router + Supabase (Postgres + Auth + Realtime + Edge Functions).
      Base de Dados: 22 tabelas em schema public. Multi-tenant via company_id.
      Edge Functions deployed: admin-users, ai-assistant v2 (16 tools), process-invoice-pdf, process-import-xlsx.
      Realtime: activa subscricoes postgres_changes em invoices, products, purchase_orders, supplier_prices.
      Storage: localStorage para cart, mini-rag-store, queue.
      Frontend: React 19, Tailwind, lucide-react, animejs v4, lenis, gsap.
    `,
  },
  {
    id: 'order-status-enum',
    title: 'Enum order_status (Postgres)',
    category: 'database',
    tags: ['enum', 'orders'],
    text: `
      Enum: order_status
      Valores aceites (em ordem): draft, pending, copied, placed, cancelled.
      
      draft: rascunho (user ainda nao confirmou pedido)
      pending: pedido enviado mas sem confirmacao (substitui 'pending' quando adicionado)
      copied: copiado para whatsapp mas ainda nao enviado
      placed: pedido realizado / enviado para fornecedor
      cancelled: cancelado
      
      Adicionar valor: ALTER TYPE order_status ADD VALUE 'novo' AFTER 'placed';
      NUNCA remova valores antigos (quebra dados existentes).
    `,
  },
  {
    id: 'match-strategy',
    title: 'Estrategias de match invoice ↔ PO (triangulacao)',
    category: 'algorithm',
    tags: ['match', 'invoice', 'po'],
    text: `
      Funcao match_invoice_line_to_po(p_line_id uuid):
      Estrategia 1 (principal): supplier_id match + product_id match + qty diff <= 20%
      Estrategia 2 (fallback): product_id match (ignora supplier), ordenado por created_at DESC
      
      Confidence: 0.85 base, bumped to 0.95 se preco matchar ±10%
      
      match_status enum: unmatched, auto_matched, manual_matched, disputed
      CAST: 'auto_matched'::match_status (nao ::text)
      
      Trigger: trg_auto_match_invoice_line (AFTER INSERT OR UPDATE OF product_id)
      
      Re-match manual:
        SELECT message FROM match_invoice_line_to_po('line-uuid-here');
      
      Performance: indices sao supplier_id+product_id, nao ha indice composto. Considerar criar.
    `,
  },
  {
    id: 'pipeline-deploy',
    title: 'Pipeline de Deploy',
    category: 'devops',
    tags: ['deploy', 'vercel', 'github-actions'],
    text: `
      Auto-deploy GitHub Actions: PARADO desde 2026-06-18.
      Workaround: deploy manual via 'npx vercel deploy --prod'.
      Token: <VERCEL_TOKEN_NO_COFRE>.
      Alias: procura-hoteis.vercel.app e aliases personalizados.
      
      Workflow 1: .github/workflows/ci.yml (lint + type + build)
      Workflow 2: .github/workflows/e2e.yml (Playwright)
      Workflow 3 (manutencao): .github/workflows/maintenance.yml (mensal)
      
      Cron Recomendado:
      - Renovate Bot (dependencias): weekly
      - Bug Hunter: daily 04:00
      - Security Auditor: weekly domingo 05:00
    `,
  },
  {
    id: 'logging',
    title: 'Sistema de Logging',
    category: 'devops',
    tags: ['logging', 'debug'],
    text: `
      Frontend: lib/logger.ts (log object)
      - Niveis: debug, info, warn, error
      - Sanitiza dados sensiveis (NIF, email, phone, price, amount)
      - Buffer em memoria (100 ultimos logs)
      - Auto-set context (user_id, page)
      - log.time() para medir duracao
      
      Edge Functions: functions/_shared/logger.ts (edgeLog)
      - Output JSON estruturado
      - edgeLog.withRequest(req) para request_id
      - edgeLog.time('scope', fn) para async com duracao
      
      Logs persistidos em: Edge Function logs (Supabase dashboard)
      Acessivel via: https://supabase.com/dashboard/project/<ref>/functions
      
      NUNCA log: passwords, tokens, NIFs, precos, emails.
    `,
  },
  {
    id: 'queue-system',
    title: 'Sistema de Queue (tarefas assincronas)',
    category: 'pattern',
    tags: ['queue', 'async', 'retry'],
    text: `
      Frontend: lib/queue.ts (Queue class)
      - Persistencia localStorage (sobrevive a refresh)
      - Retry com backoff exponencial: 5s, 25s, 125s
      - Concurrency limit (default 2)
      - Handlers registered by name
      - Stats: total, by_status, running
      
      Servidor: invoice_processing_queue (DB table)
      - pg_cron processa */15min
      - Edge Function 'process-invoice-pdf' consome fila
      
      Padrao: 
        const q = getQueue();
        q.register('parse-invoice', async (payload) => {...});
        q.enqueue('parse-invoice', { file_id }, { max_retries: 3 });
      
      Uso real: upload de fatura assincrono, process-import-xlsx trigger.
    `,
  },
  {
    id: 'error-handling',
    title: 'Tratamento de Erros Centralizado',
    category: 'pattern',
    tags: ['errors', 'patterns'],
    text: `
      lib/errors.ts exporta:
      - AppError: classe base para erros de negocio (com kind: network|auth|permission|data|validation|unknown)
      - safe(): wrapper async que nunca rejeita ({ok, data, error})
      - withRetry(): retry com backoff exponencial
      - classifyError(): categoriza erro
      - formatError(): mensagem user-friendly
      - createErrorHandler(): handler contextual
      
      components/ErrorBoundary.tsx:
      - Error Boundary global
      - Captura erros de render
      - Fallback com botao Recarregar
      - Log via logger no componentDidCatch
      
      Uso recomendado:
        const { ok, data, error } = await safe(() => fetchData(id));
        if (!ok) showError(formatError(error));
    `,
  },
  {
    id: 'rate-limiting',
    title: 'Rate Limiting ai-assistant',
    category: 'security',
    tags: ['rate-limit', 'ai'],
    text: `
      Tabela: rate_limit_log (user_id, endpoint, created_at)
      Funcao: check_rate_limit(p_user_id, p_endpoint, p_max, p_window_minutes)
      Cleanup: pg_cron cleanup-rate-limits */30min
      
      Default: 10 req/min por user por endpoint
      
      Headers HTTP:
        X-RateLimit-Limit
        X-RateLimit-Remaining
        X-RateLimit-Reset
        Retry-After (em 429)
      
      Bypass: nunca (mesmo admin).
    `,
  },
  {
    id: 'price-history',
    title: 'Historico de Precos',
    category: 'database',
    tags: ['prices', 'history'],
    text: `
      Tabela: supplier_price_history (id, supplier_id, product_id, old_price, new_price, changed_at, source)
      Trigger: trg_price_history (AFTER UPDATE OR INSERT ON supplier_prices)
      
      Valores antigos guardados ANTES do update.
      
      View: supplier_price_trend (com indicador ↑↓)
      
      NUNCA apagar registos antigos — historico e sagrado.
      
      Fonte: invoices (real-time) ou manual.
      Regra: precos SEMPRE reais (nunca inventados).
    `,
  },
  {
    id: 'carts',
    title: 'Carrinho Persistente',
    category: 'pattern',
    tags: ['cart', 'zustand'],
    text: `
      Store: frontend/src/stores/cart.ts
      Persistencia: localStorage 'compra-facil-cart' (Zustand persist)
      Backup: localStorage 'compra-facil-cart-backup' (raw)
      Version: 2
      
      Hook: useCart()
      Hook: useCartRecovery() — check + recover from backup
      
      Recovery UI: Botao 'Recuperar N items' aparece em /order se cart vazio + backup > 0.
      
      Items sobrevivem a:
      - Refresh
      - Navegacao (multi-tab)
      - Login (nao depende de user_id)
      
      Items NAO sobrevivem a:
      - Limpar dados do browser
      - Navegacao privada
      - Browser/device diferente
    `,
  },
];

console.log('Indexando', docs.length, 'documentos...');
for (const d of docs) rag.add(d);
console.log('OK');

// Simular uma pesquisa
const result = rag.search('Como funciona o sistema de logs?', { topK: 3 });
console.log('\nTop 3 hits para "Como funciona o sistema de logs?":');
for (const hit of result.hits) {
  console.log(`  [${hit.score.toFixed(3)}] ${hit.title}`);
}
