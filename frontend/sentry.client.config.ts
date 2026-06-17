/**
 * Sentry client config — só ativa se SENTRY_DSN estiver definido.
 * Se não estiver, o Sentry fica em modo "no-op" (zero overhead).
 */
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,  // 10% das transações
    replaysSessionSampleRate: 0.05,  // 5% das sessões
    replaysOnErrorSampleRate: 1.0,  // 100% se houver erro
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Ignorar erros conhecidos que não são bugs
    ignoreErrors: [
      'ResizeObserver loop',  // Erro comum do React, não é bug
      'Network request failed',
      'Failed to fetch',
    ],
  });
}
