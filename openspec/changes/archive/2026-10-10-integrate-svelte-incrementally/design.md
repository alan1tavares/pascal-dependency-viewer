# Design

## Context

Ver **proposal.md** - Why para motivação. O projeto começou com vanilla JS puro: DOM manipulation direto, sem framework, estado implícito. Agora temos um app Electron com 2 componentes (`commandPalette.js`, `graphView.js`) e a interface cresce. Precisamos modernizar sem quebrar código existente.

**Estado atual**:
- Renderer usa vanilla JS, manipulation DOM direto
- Estado em variáveis de módulo (frágil, hard to test)
- IPC via `ipcRenderer.invoke` espalhado pelo código
- Vite configurado via `vite.renderer.config.mjs` (vazio, config delegada ao Electron Forge)
- Sem framework UI, sem TypeScript, sem testing framework além de Jest

**Constraints**:
- Electron app, não web — sem SvelteKit
- Deve coexistir com vanilla JS existente durante transição
- Preload API (`window.pascalDependencyViewer`) não muda
- Não quebra componentes vanilla em operação

## Goals / Non-Goals

**Goals**:
1. Integrar Svelte como opção para novos componentes
2. Definir padrão claro: Bridge (IPC) → Store (state) → Component (render)
3. Permitir TypeScript gradual (opt-in para Svelte + services)
4. Prover testing infra (Vitest) para Svelte
5. Setup initial: pastas, config, exemplos — **sem migração real**

**Non-Goals**:
- Migrar componentes vanilla agora (CommandPalette, GraphView ficam para futuro)
- TypeScript global ou obrigatório
- Mudar comportamento existente (preload API, IPC handlers, main process)
- Forçar SvelteKit ou state management complexo (Pinia, Redux)

## Decisions

### 1. Svelte puro vs SvelteKit

**Choice**: Svelte puro

**Rationale**: SvelteKit é framework web completo (routing, SSR, etc). Aqui é Electron — só queremos componentes reactivos, não routing/server. Svelte puro + Vite é minimal e mantém controle sobre a arquitetura.

**Alternative**: SvelteKit seria overkill; viria com overhead desnecessário.

### 2. State management: svelte/store vs Pinia vs outra

**Choice**: `svelte/store` nativo (readable, writable, derived)

**Rationale**: Projeto é IPC-heavy — estado vem do main process, Stores só espelham dados. Não há lógica complexa de state machines. `svelte/store` é zero-dependência e suficiente.

**Alternatives**:
- Pinia: robusta, mas overkill para este caso, +1 dependência pesada
- Zustand, Jotai: similares, desnecessários

### 3. TypeScript: obrigatório vs gradual

**Choice**: Gradual — Svelte + services/stores ganham tipos, vanilla em JS puro

**Rationale**: Migração incremental. Novos código (Svelte) usa types desde o início (melhor DX). Código vanilla fica como está, sem refatoração forçada.

**Alternative**: TypeScript global seria mais consistente mas exigiria refatorar código existente.

### 4. Testing: Jest vs Vitest vs ambos

**Choice**: Ambos — Jest continua para `src/domain/`, Vitest novo para Svelte

**Rationale**: Jest já está em uso. Vitest tem melhor integração Vite + ESM nativo. Vitest é mais rápido. Coexistem sem conflito. `npm test` roda ambos.

**Alternative**: Migrar tudo para Vitest seria disruptivo; jest é fine para domain.

### 5. CSS: Svelte scoped vs inline global vs modules

**Choice**: Svelte scoped (padrão `<style>` em cada componente)

**Rationale**: Svelte scoped encapsula automaticamente — sem risco de conflitos. Vanilla continua com inline CSS no HTML. Quando vanilla for removido, scoped é o único padrão.

**Alternative**: CSS modules seria mais overhead. Inline é o que vanilla já faz.

### 6. Organização: src/renderer/components/ flat vs nested domains

**Choice**: Pastas flat — `src/renderer/components/`, `src/renderer/stores/`, `src/renderer/services/`

**Rationale**: Simplicidade. Já existem apenas 2 componentes. Conforme crescer, pode-se organizar por domínio (ex: `src/renderer/features/graph/`, `src/renderer/features/palette/`) depois.

**Alternative**: Nested por feature desde agora seria prematura.

### 7. Vite config: update vite.renderer.config.mjs vs deixar minimal

**Choice**: Update `vite.renderer.config.mjs` com `vite-plugin-svelte`

**Rationale**: Explícito é melhor que implícito. Deixa claro que Svelte é suportado. Se Electron Forge muda, nossa config é independente.

**Alternative**: Deixar vazio e contar que Forge detecta Svelte — menos controle.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| **Duas arquiteturas UI em paralelo** — complexidade temporária | Estabelecer padrão claro (Bridge → Store → Component), documentar em CLAUDE.md, exemplos em código |
| **Padrão Bridge + Store é novo** — dev aprende durante migração | Fazer primeira migração (CommandPalette) pequena, revisar padrão depois |
| **TypeScript gradual pode deixar código inconsistente** | Aceitar por enquanto; quando vanilla migra, todo código tem tipos |
| **Vitest + Jest roda ambos** — mais lento em CI | Build script pode rodar separado; ok por enquanto |
| **vite-plugin-svelte adiciona dependência** — versão incompatível | Fixar versão compatível com vite 8.3.1 durante setup |

## Migration Plan

1. **Setup (esta PR)**:
   - Adicionar dependências (svelte, vite-plugin-svelte, vitest, @testing-library/svelte)
   - Configurar vite.renderer.config.mjs + tsconfig.json
   - Criar pastas (`src/renderer/{components,stores,services}/`)
   - Exemplos: ipc.js (Bridge), project.js (Store), Welcome.svelte (componente)
   - **Importante**: Fazer `npm install --legacy-peer-deps` no diretório principal (não apenas no worktree) para que Electron Forge encontre as dependências
   - Validar: `npm start` renderiza Welcome.svelte

2. **PR Futuras** (1 por componente):
   - Branch: `feat/migrate-command-palette-to-svelte`
   - Migrar CommandPalette.js → CommandPalette.svelte
   - Deletar commandPalette.js
   - Testar, validar padrão
   
   - Branch: `feat/migrate-graph-view-to-svelte`
   - Migrar graphView.js → GraphView.svelte
   - Deletar graphView.js
   - Testar, validar padrão

3. **Rollback** (improvável, mas simples):
   - Se padrão não funcionar: remover `vite-plugin-svelte` de vite.config, deletar pastas `/src/renderer/{stores,services}/`, manter vanilla.

## Open Questions

Nenhuma — tudo resolvido durante grilling (Q1-Q27). Padrão, stack, escopo, organização todos documentados e validados.
