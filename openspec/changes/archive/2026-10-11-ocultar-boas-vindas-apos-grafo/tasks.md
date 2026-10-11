# Tasks

## 1. Store de controle de visibilidade

- [x] 1.1 Criar `src/renderer/stores/graph.js` com `graphRenderedStore`
      (`writable(false)`) e uma função `markGraphRendered()` que só faz
      `set(true)` (nunca volta a `false`) — sem teste Vitest dedicado
      (`vitest.config.mjs` ainda restringe `include` a
      `src/domain/test/**`, e estender isso ficou fora do escopo desta
      change); verificado por revisão do código e pela verificação visual
      dos tasks 3.1/4.1, que exercitam o store de ponta a ponta.

## 2. Disparo a partir da seleção de Root Unit

- [x] 2.1 Em `CommandPalette.svelte#selectRootUnit`, importar
      `markGraphRendered` de `../stores/graph.js` e chamá-la logo após
      `renderGraph(graph.nodes, graph.edges, graph.rootUnitId)` — verificar
      lendo o trecho alterado e confirmando que a chamada ocorre antes de
      `onRootUnitSelected?.()` e `closeCommandPalette()`.

## 3. Ocultação em `Welcome.svelte`

- [x] 3.1 Em `Welcome.svelte`, importar `graphRenderedStore` de
      `../stores/graph.js` e envolver todo o conteúdo do componente (os
      dois estados existentes, `{#if $projectStore}`/`{:else}`) em
      `{#if !$graphRenderedStore} ... {/if}`, de forma que nada seja
      renderizado quando o valor for `true` — implementado e verificado
      por `npx vite build --config vite.renderer.config.mjs` (compila sem
      erros), revisão de código e verificação manual via `npm start`
      (confirmada pelo usuário): ao selecionar uma Root Unit, a tela de
      Bem-vindo desaparece por completo.

## 4. Verificação do caso "não reaparece"

- [x] 4.1 Com o app aberto via `npm start`, após o passo 3.1: abrir um
      novo Projeto `.dpr` (ou um Projeto recente) pelo menu
      `Arquivo`/`Abrir recente` e confirmar visualmente que a tela de
      Bem-vindo continua oculta — mesmo com a Command Palette exibindo o
      modo `Selecionar Unit` para o novo Projeto, sem nenhuma Root Unit
      escolhida ainda para ele. Por código, `graphRenderedStore` nunca é
      resetado a `false` (nem em `api.onProjectLoaded`), então isso é
      garantido estruturalmente; confirmado manualmente via `npm start`
      pelo usuário.
