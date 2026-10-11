# Design

## Context

O projeto utiliza Svelte 5 com Runes (`$state`, `$derived`) para gerenciar reatividade. CommandPalette.svelte e Welcome.svelte já estabelecem o padrão: componentes que importam funções do domain, usam stores para estado compartilhado, e invocam serviços de IPC. 

**Novo**: CommandPalette.svelte agora chama `markGraphRendered()` (de `src/renderer/stores/graph.js`) após renderizar o grafo, sinalizando que a tela de boas-vindas deve se ocultar.

O GraphView.js atual é vanilla JavaScript com lógica imperativa de renderização (via `vis-network`) e filtro de visualização (checkboxes que mutam DOM).

## Goals / Non-Goals

**Goals:**
- Migrar `src/renderer/components/graphView.js` → `GraphView.svelte` preservando 100% funcionalidade
- Usar Svelte Runes para reatividade e gerenciamento de estado (filtros, visibilidade de nós/arestas)
- Manter a mesma API: componente expõe `renderGraph()` ou aceita props com `{nodesData, edgesData, rootUnitId}`
- Aproveitar `vis-network` dentro de Svelte (lifecycle hooks, reatividade de dados)
- Integrar com CommandPalette.svelte (remover import de `graphView.js`, importar `GraphView.svelte`)

**Non-Goals:**
- Alterar visual ou cores do grafo
- Modificar filtro de visualização (Interface/Implementation/External) — mantém mesma lógica
- Refatorar vis-network para bibliotecas alternativas
- Adicionar features novas
- Alterar como o componente é chamado (ainda via `renderGraph()`)

## Decisions

**1. Estratégia de Comunicação: Props Reativas vs. API Imperativa**
- **Decisão**: Manter a mesma API imperativa — `renderGraph(nodesData, edgesData, rootUnitId)` — implementada dentro do Svelte
- **Rationale**: CommandPalette.svelte atualmente chama `renderGraph()` como função. Refatorar para props causaria mudanças em CommandPalette, ampliando escopo. Com Svelte, podemos expor `renderGraph()` como função que atualiza `$state` interno.
- **Alternativa considerada**: Migrar para props reativas (e.g., `export let nodes`, `export let edges`). Rejeitada porque aumenta escopo para CommandPalette.

**2. Reatividade dos Filtros**
- **Decisão**: Usar `$state` para checkboxes (interface, implementation, external) e `$derived` para nós/arestas visíveis
- **Rationale**: Svelte recompila automaticamente quando estado muda. Remove necessidade de `.update()` manual em DataSet.
- **Alternativa considerada**: Continuar com listeners DOM (`onchange`) e `.update()` direto. Menos elegante; perde benefício do Svelte.

**3. Ciclo de Vida e Limpeza**
- **Decisão**: Usar `onMount()` para criar Network instance, `onDestroy()` para limpar
- **Rationale**: Garante Network é criada uma única vez por componente, destroída corretamente. Evita memory leaks.

**4. Arquivo vs. Componente**
- **Decisão**: Única arquivo `GraphView.svelte`; sem arquivo separado de lógica
- **Rationale**: Componente é simples o suficiente (renderização + filtro); lógica pura já está em domain/. Svelte coloca script, markup, style no mesmo arquivo.

## Risks / Trade-offs

**[Risk]** vis-network usa ID container via `document.getElementById()`. Se múltiplos GraphView montados, há colisão.
→ **Mitigation**: Usar refs Svelte (`bind:this`) para obter elemento dinamicamente; passar container como ref, não ID string.

**[Risk]** DataSet reactive bindings — Svelte não monitora `.update()` chamadas externas (vis-network).
→ **Mitigation**: Encapsular DataSet updates em funções Svelte; manter fonte de verdade em `$state` (filtros), não em DataSet.

**[Trade-off]** Manter API imperativa (`renderGraph()`) em vez de props reativas é menos "Svelte idiomático".
→ **Rationale**: Evita refatorar CommandPalette. Ainda beneficiamos reatividade interna (filtros). Escopo reduzido, menos risco.

## Migration Plan

1. Criar `GraphView.svelte` com estrutura básica
2. Implementar renderização vis-network com refs Svelte
3. Migrar lógica de filtros para `$state`/`$derived`
4. Expor `renderGraph()` via `export let` ou window.
5. Testes de componente Svelte (@testing-library/svelte)
6. Atualizar imports em CommandPalette.svelte
7. Deletar graphView.js
8. Testar integração end-to-end (abrir projeto, expandir, filtros funcionam)

## Open Questions

- Melhor forma de expor `renderGraph()` em Svelte? Via export, ou via função global? (Respondido: usar export function, CommandPalette chama como método do componente após bind.)

