/**
 * Sentry instrumentation — Next.js chama este ficheiro no boot.
 * Carrega config de cliente e servidor.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.server.config');  // mesmo config
  }
}
