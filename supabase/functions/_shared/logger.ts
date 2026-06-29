/**
 * Logger para Supabase Edge Functions (Deno).
 * 
 * - Níveis: debug, info, warn, error
 * - Auto-inclui request_id, user_id
 * - Sanitiza dados sensíveis (NIF, email, preços)
 * - Output estruturado (JSON)
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
  request_id?: string;
  user_id?: string;
  company_id?: string;
  duration_ms?: number;
  [k: string]: any;
}

const SENSITIVE_KEYS = ['nif', 'password', 'token', 'email', 'phone', 'price', 'amount'];

function sanitize(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some((s) => k.toLowerCase().includes(s))) {
      out[k] = '[REDACTED]';
    } else if (typeof v === 'object') {
      out[k] = sanitize(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function emit(level: LogLevel, scope: string, message: string, context: LogContext = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    scope,
    message,
    ...sanitize(context),
  };
  const line = JSON.stringify(entry);
  if (level === 'ERROR') console.error(line);
  else if (level === 'WARN') console.warn(line);
  else console.log(line);
}

export const edgeLog = {
  debug: (s: string, m: string, c?: LogContext) => emit('DEBUG', s, m, c),
  info: (s: string, m: string, c?: LogContext) => emit('INFO', s, m, c),
  warn: (s: string, m: string, c?: LogContext) => emit('WARN', s, m, c),
  error: (s: string, m: string, c?: LogContext) => emit('ERROR', s, m, c),
  /**
   * Mede duração de uma operação async.
   * @example await edgeLog.time('invoice.parse', () => parse(text), { invoice_id });
   */
  async time<T>(scope: string, fn: () => Promise<T>, ctx: LogContext = {}): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      emit('INFO', scope, 'ok', { ...ctx, duration_ms: Date.now() - start });
      return result;
    } catch (e: any) {
      emit('ERROR', scope, 'failed', { ...ctx, error: String(e?.message || e), duration_ms: Date.now() - start });
      throw e;
    }
  },
  /**
   * Logger contextualizado por request.
   * @example const log = withRequest(req); log.info('processing', {...});
   */
  withRequest(req: Request) {
    const request_id = req.headers.get('x-request-id') || crypto.randomUUID();
    return {
      debug: (m: string, c?: LogContext) => emit('DEBUG', 'req', m, { ...c, request_id }),
      info: (m: string, c?: LogContext) => emit('INFO', 'req', m, { ...c, request_id }),
      warn: (m: string, c?: LogContext) => emit('WARN', 'req', m, { ...c, request_id }),
      error: (m: string, c?: LogContext) => emit('ERROR', 'req', m, { ...c, request_id }),
      request_id,
    };
  },
};
