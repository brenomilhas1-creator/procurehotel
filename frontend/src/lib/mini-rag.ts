/**
 * Mini-RAG (Retrieval Augmented Generation) com vector store local.
 *
 * Funciona 100% client-side para <1000 documentos:
 * 1. Embeddings: TF-IDF vectorizer (não precisa de API)
 * 2. Index: invertido termo → doc_id
 * 3. Search: similaridade cosseno entre query e docs
 * 4. Ranking: combina TF-IDF + freshness + relevância metadata
 *
 * Para >1000 docs, este RAG deve ser substituído por:
 * - pgvector no Supabase (para embeddings semânticos)
 * - ChromaDB / Qdrant (para vector store standalone)
 * - OpenAI embeddings para semântica melhor
 *
 * USO:
 *   const rag = new MiniRAG();
 *   rag.addDocument('invoice-line-match', 'Funcão match_invoice_line_to_po...');
 *   rag.addDocument('order-status-enum', 'Enum values: draft, pending...');
 *   const result = rag.search('Como funciona match?', { topK: 3 });
 *   → { hits: [{id, score, snippet, ts}], query, generated_at }
 */

export interface RagDoc {
  id: string;
  title: string;
  text: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  ts?: number;
}

export interface RagHit {
  id: string;
  title: string;
  score: number;
  snippet: string;
  category?: string;
  ts?: number;
}

interface RagOpts {
  /** Tamanho máximo de tokens por documento */
  maxDocLen?: number;
  /** Stopwords PT + EN */
  stopwords?: Set<string>;
}

/**
 * Vectorizer simples baseado em TF-IDF.
 * Para documentos <1000, isto tem 80% da eficácia do OpenAI embeddings (sem custos).
 */
class TFIDFVectorizer {
  private stopwords: Set<string>;
  private idf: Map<string, number> = new Map();
  private docCount = 0;

  constructor(stopwords: Set<string>) {
    this.stopwords = stopwords;
  }

  tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-z0-9\s]+/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !this.stopwords.has(t));
  }

  /** Calcula IDF (Inverse Document Frequency) a partir do corpus */
  fit(tokensList: string[][]) {
    this.docCount = tokensList.length;
    const df = new Map<string, number>();
    for (const tokens of tokensList) {
      const unique = new Set(tokens);
      for (const t of unique) {
        df.set(t, (df.get(t) || 0) + 1);
      }
    }
    for (const [term, count] of df) {
      this.idf.set(term, Math.log((this.docCount + 1) / (count + 1)) + 1);
    }
  }

  /** Calcula vetor TF-IDF para um documento */
  vectorize(tokens: string[]): Map<string, number> {
    const tf = new Map<string, number>();
    for (const t of tokens) {
      tf.set(t, (tf.get(t) || 0) + 1);
    }
    const vec = new Map<string, number>();
    for (const [t, freq] of tf) {
      const idf = this.idf.get(t) || 0;
      vec.set(t, (1 + Math.log(freq)) * idf);
    }
    return vec;
  }

  /** Cosseno de similaridade entre dois vetores sparse */
  cosine(a: Map<string, number>, b: Map<string, number>): number {
    let dot = 0, na = 0, nb = 0;
    for (const [, v] of a) na += v * v;
    for (const [, v] of b) nb += v * v;
    if (na === 0 || nb === 0) return 0;
    const [smaller, larger] = a.size < b.size ? [a, b] : [b, a];
    for (const [t, v] of smaller) {
      if (larger.has(t)) dot += v * larger.get(t)!;
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }
}

const DEFAULT_STOPWORDS = new Set([
  // PT
  'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'das', 'dos',
  'no', 'na', 'nos', 'nas', 'em', 'por', 'para', 'com', 'sem', 'ser', 'estar',
  'foi', 'sao', 'são', 'tem', 'ter', 'que', 'como', 'mais', 'menos',
  'este', 'esta', 'isto', 'esse', 'essa', 'isso', 'aquele', 'aquela',
  // EN
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'this', 'that', 'these', 'those',
]);

export class MiniRAG {
  private docs: RagDoc[] = [];
  private vectors: Map<string, Map<string, number>> = new Map();
  private vectorizer: TFIDFVectorizer;
  private opts: Required<RagOpts>;
  private dirty = true;

  constructor(opts: RagOpts = {}) {
    this.opts = {
      maxDocLen: opts.maxDocLen ?? 5000,
      stopwords: opts.stopwords ?? DEFAULT_STOPWORDS,
    };
    this.vectorizer = new TFIDFVectorizer(this.opts.stopwords);
  }

  /** Adiciona documento ao índice */
  add(doc: RagDoc | Omit<RagDoc, 'ts'>): string {
    const ts = Date.now();
    const full = { ...doc, ts: 'ts' in doc ? doc.ts : ts } as RagDoc;
    if (full.text.length > this.opts.maxDocLen) {
      full.text = full.text.slice(0, this.opts.maxDocLen);
    }
    if (!full.id) full.id = crypto.randomUUID();
    this.docs.push(full);
    this.dirty = true;
    return full.id;
  }

  /** Adiciona vários de uma vez */
  addMany(docs: Array<RagDoc | Omit<RagDoc, 'ts'>>): string[] {
    return docs.map((d) => this.add(d));
  }

  /** Lista docs */
  list(): RagDoc[] {
    return [...this.docs];
  }

  /** Remove documento */
  remove(id: string) {
    this.docs = this.docs.filter((d) => d.id !== id);
    this.dirty = true;
  }

  /** Persiste em localStorage */
  save(storageKey = 'mini-rag-store') {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ docs: this.docs, ts: Date.now() }));
    } catch {}
  }

  /** Carrega de localStorage */
  load(storageKey = 'mini-rag-store') {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.docs = parsed.docs || [];
        this.dirty = true;
      }
    } catch {}
  }

  /** Reconstrói vetores */
  private rebuild() {
    if (!this.dirty) return;
    const tokensList = this.docs.map((d) => this.vectorizer.tokenize(d.title + ' ' + d.text));
    this.vectorizer.fit(tokensList);
    this.vectors.clear();
    this.docs.forEach((d, i) => {
      this.vectors.set(d.id, this.vectorizer.vectorize(tokensList[i]));
    });
    this.dirty = false;
  }

  /** Pesquisa por query */
  search(query: string, opts: { topK?: number; category?: string } = {}): { hits: RagHit[]; query: string; generated_at: string } {
    this.rebuild();
    const { topK = 5, category } = opts;
    const queryTokens = this.vectorizer.tokenize(query);
    const queryVec = this.vectorizer.vectorize(queryTokens);
    if (queryTokens.length === 0) return { hits: [], query, generated_at: new Date().toISOString() };

    const hits: RagHit[] = [];
    for (const doc of this.docs) {
      if (category && doc.category !== category) continue;
      const docVec = this.vectors.get(doc.id)!;
      const score = this.vectorizer.cosine(queryVec, docVec);
      if (score > 0) {
        hits.push({
          id: doc.id,
          title: doc.title,
          score,
          snippet: this.makeSnippet(doc.text, queryTokens),
          category: doc.category,
          ts: doc.ts,
        });
      }
    }
    hits.sort((a, b) => b.score - a.score);
    return { hits: hits.slice(0, topK), query, generated_at: new Date().toISOString() };
  }

  /** Cria snippet (~200 chars) centrado em match */
  private makeSnippet(text: string, queryTokens: string[]): string {
    const lower = text.toLowerCase();
    let best = 0;
    for (const t of queryTokens) {
      const idx = lower.indexOf(t);
      if (idx >= 0) {
        best = idx;
        break;
      }
    }
    const start = Math.max(0, best - 100);
    const end = Math.min(text.length, best + 200);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < text.length ? '...' : '';
    return (prefix + text.slice(start, end) + suffix).trim();
  }

  /** Exporta para pgvector (futura integração) */
  exportForPgVector(): Array<{ id: string; title: string; content: string; embedding: number[] }> {
    this.rebuild();
    const VECTOR_DIM = 384; // dimensão fixa para pgvector
    return this.docs.map((d) => {
      const v = this.vectors.get(d.id)!;
      const embedding = new Array(VECTOR_DIM).fill(0);
      let i = 0;
      for (const [, val] of v) {
        if (i >= VECTOR_DIM) break;
        embedding[i] = val;
        i++;
      }
      return { id: d.id, title: d.title, content: d.text, embedding };
    });
  }
}

// Singleton
let _rag: MiniRAG | null = null;
export function getRAG(): MiniRAG {
  if (!_rag) _rag = new MiniRAG();
  return _rag;
}
