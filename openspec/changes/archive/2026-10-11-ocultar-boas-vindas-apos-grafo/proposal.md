# Proposal

## Why

Ao selecionar uma Root Unit, o grafo de dependências é renderizado em
`#mynetwork`, mas a tela de Bem-vindo (`Welcome.svelte`, montada em
`#svelte-app`) nunca é escondida — os dois `<div>` são irmãos fixos em
`index.html` e nada os torna mutuamente exclusivos. Como `.welcome` tem
`min-height: 100vh`, o resultado visível é o grafo aparecendo *abaixo* da
tela de Bem-vindo, em vez de substituí-la.

## What Changes

- Um novo store Svelte (`graphRenderedStore`, em
  `src/renderer/stores/graph.js`) passa a registrar se o grafo já foi
  renderizado nesta sessão do app (booleano, inicia `false`).
- `CommandPalette.svelte`, no fluxo de seleção de Root Unit, marca esse
  store como `true` logo após chamar `renderGraph(...)` (`graphView.js`).
- `Welcome.svelte` passa a observar `graphRenderedStore` e deixa de
  renderizar seu conteúdo (`{#if !$graphRenderedStore}`) quando o valor é
  `true`.
- O flag é "uma via": depois de `true`, permanece `true` por toda a sessão
  do app — mesmo que o usuário abra um novo Projeto ou volte à tela de
  seleção de Root Unit depois. A tela de Bem-vindo, uma vez escondida, não
  volta a aparecer.

## Capabilities

### New Capabilities
- `welcome-screen`: tela de Bem-vindo exibida antes de qualquer grafo ter
  sido renderizado nesta sessão do app (estado "sem projeto" e estado
  "projeto carregado, aguardando Root Unit"), e sua regra de ocultação
  definitiva assim que o primeiro grafo é renderizado.

### Modified Capabilities
(nenhuma — `root-unit-selection` e `graph-canvas-layout` descrevem o
comportamento da tela de seleção de Root Unit e do canvas do grafo, que
não mudam; o que muda é exclusivamente a visibilidade da tela de
Bem-vindo, hoje sem cobertura de spec.)

## Impact

- `src/renderer/components/Welcome.svelte`: passa a observar o novo store
  e a não renderizar nada depois que o grafo é mostrado.
- `src/renderer/components/CommandPalette.svelte`: passa a marcar o novo
  store como `true` após `renderGraph(...)`.
- Novo arquivo `src/renderer/stores/graph.js` (store `graphRenderedStore`).
- Nenhuma mudança em `index.html`, `graphView.js` ou IPC/main process.
