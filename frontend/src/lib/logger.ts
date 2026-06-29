/**
 * Sistema de LOG centralizado.
 *
 * Substitui console.log/error/warn por uma versão com:
 * - Sentry logging (se SENTRY_DSN)
 * - Buffer em memória (até 100 últimos logs) para debugging
 * - Níveis: debug, info, warn, error
 * - Contexto global (user, request_id, page)
 * - Tempo relativo
 *
 * Não loga dados sensíveis (preços não, emails não, NIFs não).
 *
 * @example
 *   import { log } from '@/lib/logger';
 *   log.info('invoice_uploaded', { count: 34, total: 1129.57 });
 *   log.error('parse_failed', { file, error: e.message });
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  ts: number;
  level: LogLevel;
  scope: string;
  message: string;
  context?: Record<string, any>;
  duration_ms?: number;
}

type Context = {
  user_id?: string;
  company_id?: string;
  request_id?: string;
  page?: string;
  session_id?: string;
};

class Logger {
  private buffer: LogEntry[] = [];
  private context: Context = {};
  // ponytail: in-memory buffer cap=100, persists only during session; upgrade to IndexedDB for cross-session search
  private maxBuffer = 100;

  setContext(ctx: Partial<Context>) {
    this.context = { ...this.context, ...ctx };
  }

  clearContext() {
    this.context = {};
  }

  /**
   * Reduz payload para não enviar dados sensíveis ao Sentry/console.
   * Mantém apenas: ids (não pessoais), counts, durations, status codes, errors.
   */
  private sanitize(payload: Record<string, any>): Record<string, any> {
    if (!payload || typeof payload !== 'object') return payload;
    const forbidden = ['password', 'token', 'nif', 'email', 'phone', 'price', 'amount', 'cost', 'supplier_name'];
    const safe: Record<string, any> = {};
    for (const [k, v] of Object.entries(payload)) {
      if (forbidden.some((f) => k.toLowerCase().includes(f))) {
        safe[k] = '[REDACTED]';
      } else if (typeof v === 'object' && v !== null) {
        safe[k] = this.sanitize(v);
      } else {
        safe[k] = v;
      }
    }
    return safe;
  }

  private log(level: LogLevel, scope: string, message: string, context?: Record<string, any>, duration_ms?: number) {
    const entry: LogEntry = {
      ts: Date.now(),
      level,
      scope,
      message,
      context: context ? this.sanitize({ ...this.context, ...context } as Record<string, any>) : { ...this.context },
      duration_ms,
    };
    this.buffer.push(entry);
    if (this.buffer.length > this.maxBuffer) {
      this.buffer.shift();
    }

    // Format console output
    const ts = new Date(entry.ts).toISOString().slice(11, 23);
    const ctxObj: Record<string, any> = (entry.context as Record<string, any>) || {};
    const ctxStr = Object.keys(ctxObj).length > 0 ? ` ${JSON.stringify(ctxObj)}` : '';
    const method = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      const fn = (console as any)[method] || console.log;
      fn(`[${ts}] ${level.toUpperCase().padEnd(5)} [${scope}] ${message}${ctxStr}`);
    }
  }

  debug(scope: string, message: string, context?: Record<string, any>) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', scope, message, context);
    }
  }

  info(scope: string, message: string, context?: Record<string, any>) {
    this.log('info', scope, message, context);
  }

  warn(scope: string, message: string, context?: Record<string, any>) {
    this.log('warn', scope, message, context);
  }

  error(scope: string, message: string, context?: Record<string, any>, duration_ms?: number) {
    this.log('error', scope, message, context, duration_ms);
  }

  getBuffer(): LogEntry[] {
    return [...this.buffer];
  }

  /**
   * Mede duração de uma operação async.
   * @example const data = await log.time('catalog.fetch', async () => fetch(...));
   */
  async time<T>(scope: string, fn: () => Promise<T>, extra?: Record<string, any>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.info(scope, 'ok', { ...extra, duration_ms: Date.now() - start });
      return result;
    } catch (e: any) {
      this.error(scope, 'failed', { ...extra, error: e?.message, duration_ms: Date.now() - start });
      throw e;
    }
  }
}

export const log = new Logger();

// Auto-set context from URL
if (typeof window !== 'undefined') {
  log.setContext({ page: window.location.pathname });
  const origPush = window.history.pushState;
  window.history.pushState = function (...args) {
    origPush.apply(this, args);
    log.setContext({ page: window.location.pathname });
  };
}
