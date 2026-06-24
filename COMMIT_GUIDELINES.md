# 📝 Convenção de Commits — Compra Facil Hoteis

> Para quê: tornar a história do projeto **pesquisável**, **legível**, e **mantível**. Cada commit deve contar uma história completa: problema → solução → impacto.

---

## 🎯 Formato canónico (Conventional Commits)

```
<type>(<scope>): <description curta em português, ≤ 50 chars>

<body — O QUÊ, PORQUÊ, e IMPACTO em bullets estruturados>

<footer — refs, breaking changes, etc.>
```

### Tipos (type)

| Tipo | Para quê | Cor |
|---|---|---|
| **feat** | Nova funcionalidade | 🟢 |
| **fix** | Correção de bug | 🔴 |
| **refactor** | Mudança de código sem mudar comportamento | 🟡 |
| **perf** | Melhoria de performance | ⚡ |
| **docs** | Só documentação | 📚 |
| **test** | Adicionar/corrigir testes | 🧪 |
| **build** | Build system ou deps | 📦 |
| **ci** | CI/CD | 🚀 |
| **chore** | Tarefas (audit, cleanup, etc.) | 🔧 |
| **style** | Formatação (sem mudança de lógica) | 💄 |
| **revert** | Reverter commit | ⏪ |

### Scopes (opcional mas recomendado)

`catalog | order | orders | dashboard | assistant | invoice | import | cleanup | auth | db | ci | deploy | edocs | triggers | migrations | security | audit`

Mais scopes à medida que o projeto cresce. Regra: **escopo deve caber em 1 palavra** que descreva a área afetada.

---

## ✅ Checklist antes de fazer commit

1. **Mensagem em português** (linguagem do projeto)
2. **Description curta** em modo imperativo ("adiciona", não "adicionado" ou "adicionei")
3. **Body estruturado** com bullets sobre:
   - 💡 **Porquê** — qual o problema / motivação
   - 🔧 **O que** — bullet list das mudanças principais
   - 📁 **Refs** — ficheiros/funções importantes (formato `path/file.ts:linha`)
   - ✅ **Tests** — quais testes executados
4. **Footer** com referências externas (issues, docs, etc.)

---

## 📚 Templates prontos (copy-paste)

### Feature nova

```
feat(<scope>): <descrição curta>

💡 Porquê: <problema que motivou>

🔧 O que muda:
- <mudança 1>
- <mudança 2>
- <mudança 3>

📁 Refs:
- src/app/<path>/page.tsx
- src/lib/<file>.ts:<função>

✅ Tests: <typecheck / build / smoke test>

Refs: <issue, doc, etc.>
```

### Bug fix

```
fix(<scope>): <descrição curta>

💡 Porquê: <sintoma observado>
🩺 Diagnóstico: <causa raiz>

🔧 O que muda:
- <correção 1>
- <correção 2>

📁 Refs: <arquivo:linha>

✅ Tests: <como foi validado>

Refs: <issue, etc.>
```

### Refactor

```
refactor(<scope>): <descrição curta>

💡 Porquê: <dívida técnica, complexidade, etc.>

🔧 O que muda:
- <mudança 1>
- <mudança 2>

📁 Refs: <arquivos>

⚠️ Impact: <breaking change? performance?>
```

### Docs

```
docs(<scope>): <descrição curta>

💡 Porquê: <documentação em falta>

🔧 O que muda:
- <mudança 1>
- <mudança 2>

📁 Refs: <arquivos>
```

### Database migration

```
db(<scope>): <descrição curta>

💡 Porquê: <necessidade>

🔧 Schema:
- Tabela X: <coluna Y tipo Z>
- Trigger: <nome, quando dispara, o que faz>

📁 Refs: <migration file>

✅ Tests: <smoke test, query de validação>
```

### Chore / audit

```
chore(<scope>): <descrição curta>

💡 Porquê: <tarefa de manutenção>

🔧 O que muda:
- <mudança 1>
- <mudança 2>

📁 Refs: <arquivos>

📊 Resultado: <números>
```

---

## 🛠 Git aliases (recomendados)

Configurar uma vez, usar sempre:

```bash
git config alias.cfeat '!f() { git commit -m "feat($1): $2" -m "\n💡 Porquê: \n\n🔧 O que muda:\n- \n\n📁 Refs: \n\n✅ Tests: "; }; f'
git config alias.cfix '!f() { git commit -m "fix($1): $2" -m "\n💡 Porquê: \n🩺 Diagnóstico: \n\n🔧 O que muda:\n- \n\n📁 Refs: \n\n✅ Tests: "; }; f'
git config alias.cdocs '!f() { git commit -m "docs($1): $2" -m "\n💡 Porquê: \n\n🔧 O que muda:\n- \n\n📁 Refs: "; }; f'
git config alias.cchore '!f() { git commit -m "chore($1): $2" -m "\n💡 Porquê: \n\n🔧 O que muda:\n- \n\n📁 Refs: "; }; f'
git config alias.logfeat 'log --oneline --grep="^feat"'
git config alias.logfix 'log --oneline --grep="^fix"'
git config alias.logdocs 'log --oneline --grep="^docs"'
git config alias.ls 'log --oneline --grep'
```

**Uso:**
```bash
git cfeat catalog "filtros laterais (categoria, fornecedor, preço, popularidade)"
git logfeat              # só features
git logfix               # só fixes
git ls "feat(catalog)"   # pesquisa por scope
git ls "Avoneto"         # pesquisa por texto
```

---

## 🔍 Como pesquisar na história (exemplos reais)

```bash
# Por tipo
git logfeat                              # só features
git logfix                               # só fixes
git logdocs                              # só docs

# Por scope (uso do alias ls)
git ls "feat(catalog)"                   # só features do catálogo
git ls "fix(invoice)"                    # fixes de invoice
git ls "feat(catalog)" --since="2026-06-20"   # combinando com data

# Por texto livre na mensagem
git ls "Avoneto"                         # commits que mencionam Avoneto
git ls "trigger" -i                      # case-insensitive
git ls "💡"                              # commits com a estrutura nova

# Por área de código (sem o alias)
git log --oneline -- src/app/\[locale\]/\(app\)/catalog/   # commits que tocaram no catálogo

# Por data
git log --oneline --since="2026-06-15"   # commits desde 15 de junho
git log --oneline --until="2026-06-20"   # commits até 20 de junho
```

---

## 📋 Exemplos reais (do projeto)

### Bom ✓

```
feat(catalog): filtros laterais (categoria + fornecedor + preço + popularidade)

💡 Porquê: user precisa de filtrar catálogo por fornecedor/categoria para
encontrar produtos rapidamente em vez de scrollar 587 items.

🔧 O que muda:
- Sidebar de filtros à esquerda (4 grupos)
- Filtros como tags/chips com cores distintas
- Lógica AND entre grupos, OR dentro do grupo
- Tags de 'Filtros ativos' no topo (clicáveis)
- Botão 'Limpar' quando há filtros

📁 Refs:
- frontend/src/app/[locale]/(app)/catalog/page.tsx:1-300

✅ Tests: tsc OK, build OK, deploy via CLI

Refs: #ux
```

### Mau ✗

```
update catalog
```

---

## 🚫 O que NÃO fazer

- ❌ Mensagens vagas ("update", "fix", "wip")
- ❌ Misturar mudanças não-relacionadas num só commit
- ❌ Commitar código commented-out sem justificação
- ❌ Commitar segredos (tokens, passwords) — usar placeholders
- ❌ Commitar PDFs/ficheiros binários grandes sem necessidade
- ❌ Mensagens em inglês (este projeto fala português)

---

**Versão:** 1.0 (2026-06-24)
**Próxima revisão:** quando sentires que a convenção precisa evoluir
