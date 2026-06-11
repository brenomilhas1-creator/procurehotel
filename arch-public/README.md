# Compra Facil Hoteis — Arquitetura Visual

Ficheiro: [`ARCHITECTURE.html`](./ARCHITECTURE.html) (~46KB, self-contained, sem dependências externas)

## Como abrir

```bash
# Opção 1: abrir diretamente no browser
open ARCHITECTURE.html        # macOS
xdg-open ARCHITECTURE.html    # Linux
start ARCHITECTURE.html       # Windows

# Opção 2: servir localmente (recomendado para partilha)
python3 -m http.server 8000
# Abrir http://localhost:8000/ARCHITECTURE.html

# Opção 3: já está em produção
# (neste momento o ficheiro é local; deployaremos para Vercel se quiseres)
```

## Conteúdo (10 secções)

1. **Visão Geral — 4 Pilares** — diagrama User → Vercel → Supabase + GitHub
2. **Fluxo de Autenticação** — 5 passos do login com Supabase Auth
3. **Fluxo de Pedido Rápido** — autocomplete + commit no Supabase
4. **Fluxo de Admin (Edge Function)** — porquê a service_role nunca sai do Supabase
5. **Fluxo de Upload (Storage)** — bucket ocr-uploads + fila OCR
6. **Fluxo de Deploy (CI/CD)** — git push → Vercel + Supabase CLI
7. **Segurança — RLS em Detalhe** — como o Postgres valida cada query
8. **Camadas de Defesa** — 6 camadas de segurança (defense in depth)
9. **Custos — 100% Free Tiers** — tabela de preços e quando vai precisar de pagar
10. **Resumo — Mapa Mental** — visão executiva de tudo

## Tecnologia

- HTML5 + CSS moderno (variables, grid, flex)
- SVG inline para todos os diagramas
- Sem JavaScript (totalmente estático)
- Sem dependências externas (funciona offline)
- Modo escuro (dark mode por defeito)
- Responsivo (mobile, tablet, desktop)

## Screenshots

Em `/workspace/screenshots/architecture/` (10 secções + 1 full-page).
