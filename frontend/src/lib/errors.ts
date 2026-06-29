/**
 * Sistema centralizado de tratamento de erros.
 *
 * - safe(): wrapper para async que captura erros
 * - withRetry(): retry automático com backoff
 * - classifyError(): categoriza erro (network/auth/permission/data)
 * - formatError(): mensagem user-friendly
 * - AppError: classe base para erros de negócio
 */

import { log } from './logger';

export type ErrorKind = 'network' | 'auth' | 'permission' | 'data' | 'validation' | 'unknown';

export class AppError extends Error {
  kind: ErrorKind;
  context?: Record<string, any>;
  constructor(kind: ErrorKind, message: string, context?: Record<string, any>) {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
    this.context = context;
  }
}

/**
 * Classifica erro numa categoria (para decidir como responder ao user).
 */
export function classifyError(err: any): ErrorKind {
  if (err instanceof AppError) return err.kind;
  if (!err) return 'unknown';
  const msg = String(err.message || err).toLowerCase();
  if (msg.includes('jwt') || msg.includes('token') || msg.includes('unauthorized') || msg.includes('401')) return 'auth';
  if (msg.includes('permission') || msg.includes('forbidden') || msg.includes('403')) return 'permission';
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('econn')) return 'network';
  if (msg.includes('validation') || msg.includes('invalid') || msg.includes('required') || msg.includes('check constraint')) return 'validation';
  if (msg.includes('pgrst') || msg.includes('supabase') || err.code?.startsWith('PGRST')) return 'data';
  return 'unknown';
}

/**
 * Mensagem user-friendly baseada no kind.
 */
export function formatError(err: any): string {
  const kind = classifyError(err);
  const messages: Record<ErrorKind, string> = {
    network: 'Sem ligação. Verifica a internet e tenta novamente.',
    auth: 'Sessão expirada. Faz login novamente.',
    permission: 'Não tens permissão para esta ação.',
    data: 'Dados inválidos. Contacta o suporte se persistir.',
    validation: err?.message || 'Dados inválidos.',
    unknown: 'Erro inesperado. Tenta novamente.',
  };
  return messages[kind];
}

/**
 * Wrapper para async — nunca rejeita. Devolve { ok, data, error }.
 *
 * @example
 *   const { ok, data, error } = await safe(() => fetchData(id));
 *   if (!ok) showError(formatError(error));
 */
export async function safe<T>(fn: () => Promise<T>): Promise<{ ok: boolean; data: T | null; error: any }> {
  try {
    const data = await fn();
    return { ok: true, data, error: null };
  } catch (err: any) {
    log.error('safe', 'caught', { error: err?.message ?? String(err) });
    return { ok: false, data: null, error: err };
  }
}

/**
 * Retry com backoff exponencial.
 *
 * @example
 *   const data = await withRetry(() => fetch(url), { retries: 3, base: 500 });
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; base?: number; factor?: number } = {}
): Promise<T> {
  const { retries = 3, base = 1000, factor = 3 } = opts;
  let lastErr: any;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i === retries) break;
      const delay = base * Math.pow(factor, i);
      log.warn('withRetry', `attempt ${i + 1} failed`, { delay_ms: delay });
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

/**
 * Cria um Error handler contextualizado.
 *
 * @example
 *   const handleError = createErrorHandler('checkout');
 *   try { ... } catch (e) { handleError(e); }
 */
export function createErrorHandler(scope: string) {
  return function handle(err: any, userMessage?: string) {
    const kind = classifyError(err);
    log.error(scope, err?.message || 'error', { kind, code: err?.code });
    return userMessage || formatError(err);
  };
}
