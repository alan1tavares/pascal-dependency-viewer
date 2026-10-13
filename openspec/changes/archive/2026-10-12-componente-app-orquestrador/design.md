# Design

## Context

Hoje, `src/renderer/index.js` (~100 linhas) faz:
1. Monta Welcome.svelte e GraphView.svelte diretamente em `#svelte-app` e `#mynetwork`
2. Registra 4 listeners IPC (`onProjectLoaded`, `onShowCommandPalette`, etc.)
3. Mantém estado (`lastProject`, `hasRenderedGraphForCurrentProject`) e callbacks
4. Lazy-carrega e configura CommandPalette com métodos e callbacks

Os 3 componentes Svelte (Welcome, GraphView, CommandPalette) funcionam bem isoladamente, mas a orquestração está distribuída. Isso torna difícil ver o fluxo de dados global e aumenta acoplamento entre index.js e componentes.

## Goals / Non-Goals

**Goals:**
- Centralizar IPC listeners e orquestração em um único componente (App.svelte)
- Introduzir `viewMode` store para rastrear qual vista está ativa ('welcome' | 'graph')
- Reduzir index.js a ~3 linhas (import App + mount)
- Manter 100% de compatibilidade de comportamento exterior (sem breaking changes)
- Tornar o fluxo de dados explícito e fácil de entender

**Non-Goals:**
- Refatorar Welcome, GraphView, CommandPalette internamente
- Migrar componentes para TypeScript (mantém JavaScript puro)
- Adicionar testes unitários novos (orquestração é glue, não lógica testável)
- Introduzir state management pesado (svelte/store nativa é suficiente)

## Decisions

### Decision 1: App.svelte como orquestrador centralizado

**Chosen**: Criar `src/renderer/components/App.svelte` com todos os listeners IPC e lógica de transição.

**Rationale**: Um ponto único de entrada torna o fluxo de estado explícito. Em vez de buscar listeners espalhados em index.js + componentes, tudo que acontece no app começa em App.svelte.

**Alternatives considered**:
- Manter listeners em index.js, App apenas layout — menos coeso, lógica distribuída persiste
- Listener em cada componente — cada um self-hosted, difícil de coordenar transições globais

### Decision 2: viewMode store separada em ui.js

**Chosen**: Novo arquivo `src/renderer/stores/ui.js` exporta `viewMode = writable('welcome')`.

**Rationale**: Permite que qualquer componente (ou teste) reaja a mudanças de vista sem acoplamento direto. `graph.js` rais grafo, `ui.js` rais interface. Separação clara.

**Alternatives considered**:
- viewMode como estado local de App — menos reusável, testes teriam de montar App inteira
- Derivar de projectStore — `projectStore !== null` → 'graph' — menos explícito, menos flexível para estados futuros

### Decision 3: Listeners IPC centralizados no onMount de App

**Chosen**: App registra `api.onProjectLoaded()`, `api.onShowCommandPalette()`, etc. em `onMount`.

**Rationale**: Uma fonte de verdade para entrada de eventos. Quando o main process fala, App é quem escuta primeiro e decide o que fazer.

**Alternatives considered**:
- Listeners descentralizados em cada componente — CommandPalette se inscreve sozinha — menos coeso, difícil de coordenar
- Listeners em index.js, App apenas lê props — index.js fica grande novamente

### Decision 4: App é opaca — index.js não chama métodos nele

**Chosen**: App é uma caixa preta. index.js só faz `new App({ target })`.

**Rationale**: Menos acoplamento. Se App precisar mudar como chama GraphView internamente, index.js não sabe nem precisa saber.

**Alternatives considered**:
- Expor métodos (App.renderGraph, App.showPalette) — permite index.js ser mais "inteligente", mas viola separação de responsabilidade
- Props de inicialização (App recebe estado inicial) — mais testável, mas adds complexity

### Decision 5: Sem refactor de Welcome, GraphView, CommandPalette

**Chosen**: Esses 3 componentes permanecem com a mesma API interna. App adapta-se a eles.

**Rationale**: Mudança é sobre orquestração, não redesign de componentes. Reduz blast radius.

**Alternatives considered**:
- Refatorar CommandPalette para ser mais reactive — grande mudança, fora de escopo

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| **bind:this referencias podem virar null em edge cases** | Testes manuais + cenários específicos de desmontagem. Em prática, Svelte cuida bem disso. |
| **App fica "grande"** (todos listeners + lógica) | Coesão justifica. Se crescer, pode ser dividida em store actions futuras. |
| **Dependência circular se componentes filhos tentarem importar App** | Padrão parent→child resolve isso. Componentes filhos só conhecem stores, não App. |
| **Transições entre vistas podem ficar lerdas se GraphView demorar a renderizar** | Não novo (já é assim). UX melhora se CommandPalette non-closable ficar no lugar durante seleção de Unit. |

## Migration Plan

1. Criar `src/renderer/stores/ui.js` com `viewMode` store
2. Criar `src/renderer/components/App.svelte` com lógica de orquestração
3. Atualizar `src/renderer/index.js` para montar App apenas
4. Simplificar `index.html` para um único `<div id="app">`
5. Teste manual: abrir projeto, selecionar unit, vê grafo renderizar, CommandPalette funciona
6. Commit + merge quando tudo passar

**Rollback**: Se necessário, reverter para branches antigas (Git tem histórico). Não há migração de dados.

## Open Questions

Nenhuma — o design está completo para começar implementação.
