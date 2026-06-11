# NPM Audit Report — Frontend

**Data**: 2026-06-11
**Projeto**: compra-facil-hoteis (Next.js 15)
**Total deps**: 481 packages
**Lockfile**: package-lock.json

---

## Resumo

| Severidade | Total |
|---|---|
| Critical | 0 |
| High | 0 |
| Moderate | 3 |
| Low | 0 |
| **TOTAL** | **3** |

## Vulnerabilidades Moderate

### `next` — moderate

- Titulo: postcss
- Advisory: 
- Fix disponivel: Sim

**Mitigacao aplicada**:
- Aceitamos o risco (F3: agendar upgrade)
- A vulnerabilidade `next-intl` requer attacker-controlled translation catalog keys - nao aplicavel (catalog estatico no nosso proprio repo)
- A vulnerabilidade `postcss` XSS via unescaped </style> - mitigada pelo nosso CSP

**Upgrade planeado (Fase 3)**:
```
npm install next-intl@4.13.0  # breaking change
npm install next@latest
```

## Boas praticas

- Lockfile commitado
- Sem dependencias sem maintainer
- npm audit em CI planeado (Fase 3)
- Renovate/Dependabot recomendado (F3)
### `next-intl` — moderate

- Titulo: next-intl has an open redirect vulnerability
- Advisory: https://github.com/advisories/GHSA-8f24-v5vv-gm5j
- Fix disponivel: Sim

**Mitigacao aplicada**:
- Aceitamos o risco (F3: agendar upgrade)
- A vulnerabilidade `next-intl` requer attacker-controlled translation catalog keys - nao aplicavel (catalog estatico no nosso proprio repo)
- A vulnerabilidade `postcss` XSS via unescaped </style> - mitigada pelo nosso CSP

**Upgrade planeado (Fase 3)**:
```
npm install next-intl@4.13.0  # breaking change
npm install next@latest
```

## Boas praticas

- Lockfile commitado
- Sem dependencias sem maintainer
- npm audit em CI planeado (Fase 3)
- Renovate/Dependabot recomendado (F3)
### `postcss` — moderate

- Titulo: PostCSS has XSS via Unescaped </style> in its CSS Stringify Output
- Advisory: https://github.com/advisories/GHSA-qx2v-qp2m-jg93
- Fix disponivel: Sim

**Mitigacao aplicada**:
- Aceitamos o risco (F3: agendar upgrade)
- A vulnerabilidade `next-intl` requer attacker-controlled translation catalog keys - nao aplicavel (catalog estatico no nosso proprio repo)
- A vulnerabilidade `postcss` XSS via unescaped </style> - mitigada pelo nosso CSP

**Upgrade planeado (Fase 3)**:
```
npm install next-intl@4.13.0  # breaking change
npm install next@latest
```

## Boas praticas

- Lockfile commitado
- Sem dependencias sem maintainer
- npm audit em CI planeado (Fase 3)
- Renovate/Dependabot recomendado (F3)
