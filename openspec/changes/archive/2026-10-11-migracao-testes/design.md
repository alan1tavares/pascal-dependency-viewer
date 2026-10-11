# Design: Migração Jest → Vitest

## Contexto

O projeto tem dois sistemas de teste:
- **Jest** (v25.0.0 — versão antiga): Testes de domínio em `src/domain/test/` com 7 suites
  - Rodado via `npm test` com `NODE_OPTIONS=--experimental-vm-modules` (ESM)
  - Configuração em `jest.config.js` (simples: `clearMocks`, `testEnvironment: "node"`)
- **Vitest** (v5.0.3): Testes de componentes Svelte em `src/renderer/components/`
  - Rodado via `npm run test:vitest`
  - Sem arquivo de configuração explícito (usa defaults Vitest)

Após `feat/svelte`, ambos os runners convivem, duplicando overhead CI/CD e fragmentando o setup.

## Objetivos e Não-Objetivos

**Objetivos:**
- Unificar todos os testes sob um único runner (Vitest)
- Simplificar `npm test` para rodar ambas as suites (domínio + componentes)
- Remover Jest e suas dependências
- Manter cobertura e comportamento de teste equivalentes

**Não-Objetivos:**
- Adicionar novos testes ou aumentar cobertura
- Refatorar testes existentes (apenas migrar sintaxe)
- Implementar relatórios de cobertura avançados

## Decisões

### 1. Usar Vitest como único runner
**Decisão:** Consolidar em Vitest para ambas as suites (domínio + componentes).

**Rationale:**
- Vitest já está integrado ao pipeline Vite/Svelte
- Suporta ESM nativamente (sem `NODE_OPTIONS` workaround)
- API compatível com Jest (reduz churn de migração)
- Melhor performance (parallelização automática)

**Alternativas consideradas:**
- Manter Jest + Vitest em paralelo → Custo operacional contínuo
- Migrar para outro runner (Mocha, Ava) → Sem integração existente, maior esforço

### 2. Estrutura de configuração
**Decisão:** Criar `vitest.config.mjs` central com perfis para domínio e componentes.

**Rationale:**
- Evita duplicação de config
- Cada perfil herda base, pode sobrescrever (`testEnvironment`, `setupFiles`)
- Um único `npm test` roda ambas as suites em série

**Config:**
```javascript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // padrão para domínio
    include: ['src/domain/test/**/*.test.js'],
    exclude: ['node_modules', 'node_modules_mac', 'node_modules_linux'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['/node_modules/', 'src/domain/test/'],
    },
  },
  // Projeto separado para componentes Svelte (environment: jsdom, setupFiles, etc.)
});
```

### 3. Compatibilidade de sintaxe
**Decisão:** Manter 100% das APIs Jest existentes (describe, it, expect, mocks) — Vitest suporta nativamente.

**Racional:**
- Nenhuma mudança necessária nos testes existentes
- Setup simples: apenas remove imports Jest, adiciona Vitest globals
- Reduz risco de regressão

### 4. Coverage e CI/CD
**Decisão:** Consolidar coverage em um único ponto de saída.

**Rationale:**
- Vitest gera coverage.json automaticamente
- CI/CD roda um único `npm test` sem condicional
- Cobertura combinada (domínio + componentes) em uma dashboard

## Riscos e Trade-offs

| Risco | Mitigação |
|-------|-----------|
| Testes Jest com features não-suportadas em Vitest | Auditoria pré-migração; jest.config.js é config mínima, baixo risco |
| Diferenças de performance/ordem de execução | Testes Vitest são determinísticos; suite domínio não tem dependências |
| Node.js version mismatch (Vitest precisa v18+) | Verificar engines no `.node-version` ou CI antes de merge |

**Trade-off:** Setup único vs. flexibilidade por suite — aceitável porque ambas as suites têm requisitos simples.

## Plano de Migração

1. **Criar `vitest.config.mjs`** com projects para domínio + componentes
2. **Auditar testes Jest** (7 arquivos) — verificar imports não-suportados
3. **Migrar imports** em cada `.test.js` (remover `jest`, usar globals)
4. **Remover** `jest.config.js` após validação
5. **Atualizar `package.json`**:
   - Unificar scripts: `"test": "vitest run"` + `"test:watch": "vitest"`
   - Remover `jest` do devDependencies
   - Opcional: adicionar `npm run test:coverage` para relatório
6. **Atualizar docs** (`CLAUDE.md`, README)

## Open Questions

- Será necessário ajustar `testMatch` patterns após migração? (Responder ao validar em breve)
- Há snapshots Jest que precisam reconverter? (Vitest lê .json de Jest, mas melhor validar)
