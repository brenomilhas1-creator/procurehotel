/**
 * Parser de texto livre de pedidos.
 *
 * Corrige os 6 bugs identificados em 2026-07-06:
 * - #1 match scoring com word boundary (não substring cego)
 * - #3 regex separa unidades (kg/l/cl/ml)
 * - #6 items sem match → needs_review separados
 *
 * Funções puras (testáveis), sem dependências externas.
 */

export interface AliasEntry {
  alias: string;
  product_id: string;
  product_name: string;
  unit: string;
}

export interface ParsedItem {
  raw_line: string;
  quantity: number;
  unit_hint: string | null;
  raw_product: string;
  product_id: string | null;
  product_name: string | null;
  matched_alias: string | null;
  needs_review: boolean;
  match_score: number;
  parser_alternatives?: Array<{ product_id: string; product_name: string; matched_alias: string; score: number }>;
}

export interface ParseOptions {
  /** Permitir fuzzy matching (default true) */
  fuzzy?: boolean;
  /** Score mínimo para considerar match (default 0.6) */
  min_score?: number;
}

/**
 * Normaliza string para matching:
 * - lowercase
 * - remove acentos (NFD + remove combining chars)
 * - colapsa espaços
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokeniza texto em palavras (ignora pontuação).
 */
export function tokenize(s: string): string[] {
  return normalize(s)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/**
 * Regex para parsing: captura qty + unit + product.
 * Suporta:
 *  - "5x coca"
 *  - "5 coca"
 *  - "coca x 5"
 *  - "5 unidades coca"
 *  - "1kg carne"
 *  - "0,5L leite"
 *  - "2.5kg batata"
 *
 * Devolve: qty, unit_hint, raw_product
 */
const NUMBER_PREFIX = /^([0-9]+(?:[.,][0-9]+)?)(kg|g|gr|lt|l|cl|ml|un|unidades?|unid)?(?:\s+|$)(.+)$/i;
const NUMBER_X_SEP = /^([0-9]+(?:[.,][0-9]+)?)\s*[xX]\s+(.+)$/i;
const REVERSE_RE = /^(.+?)\s*[-–]\s*([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/i;

export function parseLine(line: string): { quantity: number; unit_hint: string | null; raw_product: string } {
  const trimmed = line.trim();
  if (!trimmed) return { quantity: 1, unit_hint: null, raw_product: '' };

  // Formato "5x coca" ou "5 x coca"
  const xMatch = trimmed.match(NUMBER_X_SEP);
  if (xMatch) {
    const qty = parseFloat(xMatch[1].replace(',', '.'));
    return { quantity: qty || 1, unit_hint: null, raw_product: (xMatch[2] || '').trim() };
  }

  // Formato "5 leite" / "1kg carne" / "0,5L leite"
  const numMatch = trimmed.match(NUMBER_PREFIX);
  if (numMatch) {
    const qty = parseFloat(numMatch[1].replace(',', '.'));
    const unit = numMatch[2] ? numMatch[2].toLowerCase() : null;
    const product = (numMatch[3] || '').trim();
    return { quantity: qty || 1, unit_hint: unit, raw_product: product };
  }

  // Tentar padrão reverso: produto - qty
  const m2 = trimmed.match(REVERSE_RE);
  if (m2) {
    const qty = parseFloat(m2[2].replace(',', '.'));
    const product = (m2[1] || '').trim();
    return { quantity: qty || 1, unit_hint: null, raw_product: product };
  }

  // Sem número: tudo é produto
  return { quantity: 1, unit_hint: null, raw_product: trimmed };
}

/**
 * Constrói mapa de aliases → entries.
 * Aceita lista de aliases + products e unifica.
 */
export function buildAliasMap(
  aliases: AliasEntry[],
  products: Array<{ id: string; master_name: string; unit: string }>
): AliasEntry[] {
  const seen = new Set<string>();
  const out: AliasEntry[] = [];
  // Aliases têm prioridade sobre master_name
  for (const a of aliases) {
    const key = normalize(a.alias);
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ ...a, alias: key });
    }
  }
  for (const p of products) {
    const key = normalize(p.master_name);
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ alias: key, product_id: p.id, product_name: p.master_name, unit: p.unit });
    }
  }
  return out;
}

/**
 * Score de match entre 0 e 1:
 * - 1.0 = match exato (palavra inteira)
 * - 0.8 = substring contida em outra palavra completa
 * - 0.5 = match parcial em início
 * - penalizado se overlap < 80%
 */
export function scoreMatch(input: string, alias: string): number {
  if (!input || !alias) return 0;

  // Match exato
  if (input === alias) return 1.0;

  const inputTokens = new Set(tokenize(input));
  const aliasTokens = new Set(tokenize(alias));

  if (inputTokens.size === 0 || aliasTokens.size === 0) return 0;

  // word boundary check
  const wordBoundary = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  const inputHasAlias = wordBoundary.test(input);
  const aliasHasInput = new RegExp(`\\b${input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(alias);

  if (inputHasAlias || aliasHasInput) {
    // Match exato em boundary
    let score = 0.9;
    // Bonus se coverage > 80%
    const intersection = [...inputTokens].filter((t) => aliasTokens.has(t));
    const coverage = intersection.length / Math.max(inputTokens.size, aliasTokens.size);
    if (coverage >= 0.8) score = 1.0;
    return score;
  }

  // Substring sem word boundary — penalizado
  if (input.includes(alias) || alias.includes(input)) {
    const overlap = Math.min(input.length, alias.length) / Math.max(input.length, alias.length);
    if (overlap >= 0.8) return 0.5; // parcial
  }

  return 0;
}

/**
 * Encontra melhor match para `input` na lista de aliases.
 * - Exige word boundary (regex \b)
 * - Escolhe o de MAIOR score, não o primeiro
 * - Devolve top 3 alternativas como tiebreaker.
 */
export function findBestMatch(
  input: string,
  aliases: AliasEntry[],
  opts: ParseOptions = {}
): { best: { entry: AliasEntry; score: number } | null; parser_alternatives?: Array<{ entry: AliasEntry; score: number }> } {
  // min_score mais baixo para gathering alternatives (0.3 em vez de 0.6)
  // para mostrar opções ao user mesmo sem match ideal.
  const minScore = opts.min_score ?? 0.6;
  const altScore = Math.min(minScore, 0.3);
  const norm = normalize(input);
  if (!norm || norm.length < 2) return { best: null, parser_alternatives: [] };

  const allScored: Array<{ entry: AliasEntry; score: number }> = [];
  for (const a of aliases) {
    const score = scoreMatch(norm, a.alias);
    allScored.push({ entry: a, score });
  }

  const overMin = allScored.filter((s) => s.score >= minScore);
  overMin.sort((a, b) => b.score - a.score);

  // Alternatives: tudo o que tiver score >= altScore, excluindo best
  const alts = allScored
    .filter((s) => s.score >= altScore && (!overMin[0] || s.entry.alias !== overMin[0].entry.alias))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    best: overMin[0] ?? null,
    parser_alternatives: alts,
  };
}

/**
 * Parser principal. Recebe texto + lista de aliases + lista de products.
 *
 * @example
 *   const items = parseOrder("5 leite\n1kg carne", aliases, products);
 *   // → [
 *   //   { raw_product: 'leite', quantity: 5, product_id: '...', ... },
 *   //   { raw_product: 'carne', quantity: 1, unit_hint: 'kg', product_id: '...', ... },
 *   // ]
 */
export function parseOrder(
  text: string,
  aliases: AliasEntry[],
  products: Array<{ id: string; master_name: string; unit: string }>,
  opts: ParseOptions = {}
): ParsedItem[] {
  const aliasMap = buildAliasMap(aliases, products);
  const lines = text.split(/\r?\n+/).map((l) => l.trim()).filter(Boolean);
  const items: ParsedItem[] = [];

  for (const line of lines) {
    const { quantity, unit_hint, raw_product } = parseLine(line);
    const { best, parser_alternatives: alternatives } = findBestMatch(raw_product, aliasMap, opts);

    items.push({
      raw_line: line,
      quantity,
      unit_hint,
      raw_product,
      product_id: best?.entry.product_id ?? null,
      product_name: best?.entry.product_name ?? null,
      matched_alias: best?.entry.alias ?? null,
      needs_review: !best,
      match_score: best?.score ?? 0,
      parser_alternatives: (alternatives || []).map((a: any) => ({
        product_id: a.entry.product_id,
        product_name: a.entry.product_name,
        matched_alias: a.entry.alias,
        score: a.score,
      })),
    });
  }

  return items;
}
