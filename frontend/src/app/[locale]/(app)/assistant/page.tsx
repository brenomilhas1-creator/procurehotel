'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, User, Send, Settings2, X, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth';
import { useAIConfig, type AIProvider } from '@/stores/ai-config';
import { getSupabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/supabase-data';

interface ChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
  toolResults?: { tool: string; args: any; result: any }[];
}

const SUGGESTIONS = [
  'Cria um fornecedor chamado "Makro"',
  'Lista os fornecedores existentes',
  'Quantos produtos tenho?',
  'Qual a saúde da base de dados?',
];

export default function AssistantPage() {
  const { accessToken } = useAuthStore();
  const cfg = useAIConfig();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setError(null);
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setBusy(true);

    try {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase indisponível');
      const { data: { session } } = await sb.auth.getSession();
      const auth = session?.access_token || accessToken;
      if (!auth) throw new Error('Sessão expirou — faça login novamente');

      // Chamar Edge Function
      const url = `https://fpjhvyydavssrzrkvlbd.supabase.co/functions/v1/ai-assistant`;
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          provider: cfg.provider,
          apiKey: cfg.apiKey,
          baseUrl: cfg.baseUrl,
          model: cfg.model,
        }),
      });

      if (!r.ok) {
        const errText = await r.text();
        throw new Error(`HTTP ${r.status}: ${errText.slice(0, 200)}`);
      }

      const data = await r.json();
      if (data.error) throw new Error(data.error);

      setMessages([
        ...newMessages,
        { role: 'assistant', content: data.reply, toolResults: data.tool_results },
      ]);

      trackEvent({
        event_type: 'assistant_used',
        payload: { provider: cfg.provider, tools: data.tool_results?.map((r: any) => r.tool) },
      });
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl mx-auto h-[calc(100vh-7rem)] flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Assistente IA
          </h1>
          <p className="text-sm text-muted-foreground">
            Fala comigo para criar fornecedores, ver produtos e fazer perguntas sobre os dados
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
          {showSettings ? <X className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
          {showSettings ? 'Fechar' : 'Config'}
        </Button>
      </div>

      {showSettings && (
        <Card className="flex-shrink-0">
          <CardHeader>
            <CardTitle className="text-base">Configuração de IA</CardTitle>
            <CardDescription>
              Escolhe o provider. "MiniMax" usa a API padrão do sistema (não precisa chave). Ollama corre local.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Provider</label>
                <select
                  className="w-full h-10 rounded-md border bg-background px-3"
                  value={cfg.provider}
                  onChange={(e) => cfg.setProvider(e.target.value as AIProvider)}
                >
                  <option value="minimax">MiniMax (padrão, sem chave)</option>
                  <option value="openai">OpenAI (BYOK)</option>
                  <option value="ollama">Ollama (local)</option>
                  <option value="custom">Outro (compatível OpenAI)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Modelo</label>
                <Input
                  placeholder="deixar vazio = default"
                  value={cfg.model}
                  onChange={(e) => cfg.setModel(e.target.value)}
                />
              </div>
            </div>
            {cfg.provider !== 'minimax' && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground">API Key</label>
                  <Input
                    type="password"
                    placeholder={cfg.provider === 'ollama' ? '(não precisa)' : 'sk-...'}
                    value={cfg.apiKey}
                    onChange={(e) => cfg.setApiKey(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Base URL (opcional)</label>
                  <Input
                    placeholder={cfg.provider === 'ollama' ? 'http://localhost:11434/v1' : 'https://api.openai.com/v1'}
                    value={cfg.baseUrl}
                    onChange={(e) => cfg.setBaseUrl(e.target.value)}
                  />
                </div>
              </>
            )}
            <p className="text-xs text-muted-foreground">
              💡 A configuração é guardada no localStorage. Ollama precisa do CORS habilitado:
              <code className="ml-1 text-xs">OLLAMA_ORIGINS="*" ollama serve</code>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Chat area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8 space-y-4">
              <Sparkles className="h-10 w-10 text-primary mx-auto" />
              <div>
                <p className="text-sm font-medium">Começa a falar comigo</p>
                <p className="text-xs text-muted-foreground">Posso criar fornecedores, listar produtos, mostrar a saúde da base</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s)}
                    disabled={busy}
                    className="px-3 py-1.5 text-xs rounded-md border bg-muted/30 hover:bg-muted disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
              {m.role !== 'user' && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`rounded-lg px-3 py-2 max-w-[80%] ${
                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                {m.toolResults && m.toolResults.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {m.toolResults.map((tr, j) => (
                      <div key={j} className="flex items-start gap-1.5 text-xs">
                        {tr.result?.ok ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                          <code className="text-xs opacity-70">{tr.tool}</code>
                          {tr.result?.ok ? (
                            <span className="text-emerald-600 ml-1">
                              {tr.tool === 'create_supplier' && tr.result?.data?.name
                                ? ` → "${tr.result.data.name}" criado`
                                : tr.tool === 'list_suppliers'
                                  ? ` → ${tr.result.data?.length || 0} fornecedores`
                                  : tr.tool === 'list_products'
                                    ? ` → ${tr.result.data?.length || 0} produtos`
                                    : tr.tool === 'get_data_health'
                                      ? ` → ${tr.result.data?.active_products || 0} produtos, ${tr.result.data?.active_suppliers || 0} fornecedores`
                                      : ''}
                            </span>
                          ) : (
                            <span className="text-red-600 ml-1">→ erro: {tr.result?.error}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {m.role === 'user' && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {busy && (
            <div className="flex gap-2">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <div className="rounded-lg px-3 py-2 bg-muted/50 flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-xs text-muted-foreground">a pensar...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-500/10 text-red-600 dark:text-red-300 px-3 py-2 text-sm">
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>

        <div className="border-t p-3 flex gap-2 flex-shrink-0">
          <Input
            placeholder="Escreve uma mensagem..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send(input)}
            disabled={busy}
            className="flex-1"
          />
          <Button onClick={() => send(input)} disabled={busy} title="Enviar mensagem">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar
          </Button>
        </div>
      </Card>
    </div>
  );
}
