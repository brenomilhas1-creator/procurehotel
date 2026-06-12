/**
 * Migração one-time para limpar dados sensíveis de localStorage.
 * Apaga a versão antiga (`procurehotel.auth`) e qualquer outro vestígio.
 * Deve ser executada no boot do app, uma vez.
 */

'use client';

const MIGRATION_KEY = 'cf.migrated.v1';
const OLD_KEYS = [
  'procurehotel.auth',
  'procurehotel.preorder',
  // Adicionar mais chaves antigas aqui se aparecerem
];

export function runLocalStorageMigration() {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(MIGRATION_KEY) === '1') return;
    let removed = 0;
    for (const k of OLD_KEYS) {
      if (localStorage.getItem(k) !== null) {
        localStorage.removeItem(k);
        removed++;
      }
    }
    localStorage.setItem(MIGRATION_KEY, '1');
    if (removed > 0) {
      console.info(`[migration] Removidas ${removed} chaves antigas do localStorage`);
    }
  } catch (e) {
    // Silencioso — não bloquear UX
  }
}
