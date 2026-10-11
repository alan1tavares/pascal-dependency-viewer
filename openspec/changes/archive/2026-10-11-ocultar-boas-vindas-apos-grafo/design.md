# Design

## Context

`Welcome.svelte` (montada em `#svelte-app`) e o canvas do grafo
(`#mynetwork`, populado por `graphView.js#renderGraph`, chamado de
`CommandPalette.svelte#selectRootUnit`) são irmãos fixos no DOM
(`index.html`) e hoje não têm nenhuma relação de visibilidade entre si —
ver proposal.md (Why) para o efeito visual resultante. `renderGraph` é
código vanilla (fora do mundo Svelte); `CommandPalette.svelte` já importa
e chama essa função diretamente. `Welcome.svelte` já reage a um store
Svelte (`projectStore`) para alternar entre seus dois estados internos.

## Goals / Non-Goals

**Goals:**
- Garantir que a transição Bem-vindo → grafo seja feita através do mesmo
  mecanismo reativo (store Svelte) que `Welcome.svelte` já usa para seu
  próprio conteúdo, em vez de manipulação direta de `style.display` a
  partir de `renderer/index.js`.
- Tornar a ocultação da tela de Bem-vindo permanente pelo resto da sessão
  do app, sem reintroduzir a flag `hasRenderedGraphForCurrentProject` que
  hoje já existe em `renderer/index.js` para outro propósito (fechamento
  da Command Palette).

**Non-Goals:**
- Migrar `graphView.js` ou a lógica de renderização do grafo para Svelte.
- Mudar qualquer comportamento do `projectStore` ou da Command Palette
  além do ponto único de disparo descrito abaixo.
- Resolver o layout do `#mynetwork` quando a janela é redimensionada
  (capability `graph-canvas-layout`, inalterada).

## Decisions

**Novo store dedicado (`graphRenderedStore`) em vez de reaproveitar
`projectStore`.** `projectStore` representa o Projeto carregado e é
substituído (`set`) a cada novo `.dpr` aberto; usar um campo nele para
"grafo já renderizado" exigiria lógica extra para não resetar esse campo
a cada novo Projeto. Um store próprio, de responsabilidade única
(`boolean`, que só vai de `false` para `true`, nunca o contrário), deixa
essa regra "uma via" explícita e isolada — sem depender de nenhum código
saber *não* resetá-lo.

**Ponto de disparo: `CommandPalette.svelte#selectRootUnit`, logo após
`renderGraph(...)`.** É o único lugar do código que já chama
`renderGraph`, então marcar o store ali mantém "grafo renderizado" e
"renderizou o grafo" no mesmo local, sem introduzir um segundo canal de
comunicação (ex.: callback `onRootUnitSelected` existente, que serve a
um propósito diferente — fechabilidade da paleta — e não deveria crescer
para fazer duas coisas).

**`Welcome.svelte` reage ao store para decidir se renderiza algo, em vez
de `renderer/index.js` manipular `#svelte-app.style.display`.** Mantém a
visibilidade do componente Svelte dentro do próprio mundo Svelte
(consistente com o padrão store → componente já usado para
`projectStore`), em vez de misturar manipulação de DOM vanilla com um
componente montado pelo Svelte.

## Risks / Trade-offs

- [O estado "uma via" vive só na memória do processo renderer — um reload
  manual da janela (não exposto na UI hoje) voltaria a mostrar a tela de
  Bem-vindo] → aceitável: não há nenhum fluxo do app que recarregue a
  janela, e o comportamento após um reload real seria idêntico ao de
  reabrir o app, o que já é esperado.
- [Um novo store dedicado, em vez de um campo em `projectStore`,
  adiciona um arquivo pequeno a mais em `stores/`] → aceitável: o nome
  (`graphRenderedStore`) e a responsabilidade única deixam a regra "uma
  via" auto-explicativa, mais barato de entender do que lógica condicional
  dentro do listener que já atualiza `projectStore`.
