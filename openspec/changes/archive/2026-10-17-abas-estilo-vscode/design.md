# Design

## Context

Motivação e escopo: ver `proposal.md`. Requisitos: ver `specs/tabs/spec.md`
e os deltas das demais capabilities.

Estado atual do renderer, relevante para a abordagem:

- `App.svelte` alterna entre `<Welcome/>` e uma única `<GraphView/>` por um
  `{#if}` sobre a store `viewMode` (`stores/ui.js`, enum
  `'welcome' | 'graph'`). Trocar de vista desmonta a outra.
- Existe uma única `GraphView`, cuja referência (`bind:this`) é entregue à
  `CommandPalette` via `configureCommandPalette`. Ao escolher uma Root Unit,
  a própria paleta chama `api.expandFromRootUnit(...)` e depois
  `graphViewComponent.renderGraph(...)`, que limpa e repopula o mesmo
  `DataSet` do `vis-network` (`services/networkRenderer.js`).
- `stores/graph.js` (`graphRenderedStore`) é uma flag de mão única usada só
  para esconder o Welcome e decidir se o modo `Selecionar Unit` é fechável.
- O painel de View Filter da `GraphView` usa `position: fixed` relativo à
  janela.
- O main process não guarda estado de vista: `expandFromRootUnit` é
  stateless e só os Recent Projects são persistidos.
- Testes automatizados (`vitest.config.mjs`) só rodam `src/domain/test/**`.

## Goals / Non-Goals

**Goals:**
- Regras de Tabs (abrir, ativar, fechar, ordem de ativação, ciclo) num
  módulo puro de domínio, coberto por testes como o resto de `src/domain/`.
- Preservar o estado de cada Graph Tab (View Filter, posições, zoom) sem
  serializá-lo, mantendo cada `GraphView` montada.
- Nenhum estado de Tab no main process e nenhuma persistência.

**Non-Goals:**
- Testes de componentes Svelte: a infraestrutura (`@testing-library/svelte`
  e `include` do Vitest) continua fora deste escopo, como já registrado em
  `docs/SUGGESTION.md`.
- Corrigir textos antigos do Welcome (por exemplo, a dica `Cmd/Ctrl+K`).

## Decisions

### 1. Regras de Tabs em `src/domain/tabs/`, como funções puras sobre um estado imutável

Estado: `{ tabs, activeId, activationOrder }`, em que `tabs` é a lista na
ordem da barra, cada item `{ id, kind: 'welcome' | 'graph', ... }`, e
`activationOrder` é a lista de ids do ativado mais recentemente para o mais
antigo. Funções:

- `initialTabsState()`: só a Welcome Tab, ativa.
- `openWelcomeTab(state)`: ativa a Welcome Tab, ou a adiciona no fim e ativa.
- `openGraphTab(state, tab)`: ativa a Graph Tab de mesmo `id` se existir, ou
  adiciona no fim e ativa.
- `activateTab(state, id)`: move `id` para o início de `activationOrder`.
- `closeTab(state, id)`: no-op se `!canCloseTab(state, id)`. Remove a Tab;
  se ela era a ativa, ativa a primeira de `activationOrder` que continua
  aberta; se não sobrou nenhuma, volta a `initialTabsState()`.
- `canCloseTab(state, id)`: falso só quando a Tab é a Welcome Tab e é a
  única aberta.
- `closeGraphTabs(state)`: remove todas as Graph Tabs e ativa a Welcome Tab,
  abrindo-a se preciso.
- `nextTab(state)` / `previousTab(state)`: vizinha pela posição na barra, em
  ciclo; no-op com uma única Tab.

Id da Welcome Tab: `'welcome'`. Id de uma Graph Tab:
`graph:<rootUnitId>`, em que `rootUnitId` é o `unitName` da Root Unit em
minúsculas, exatamente como `expandDependencyGraph` o calcula
(`rootUnitName.toLowerCase()`).
Como abrir um Project fecha todas as Graph Tabs, ids de Projects diferentes
nunca convivem.

O domínio trata o resto da Graph Tab (título, caminho, dados do grafo) como
carga opaca.

*Alternativa considerada*: lógica direto na store do renderer. Rejeitada
porque as regras de ordem de ativação e de ciclo são as mais fáceis de
errar e o único lugar com testes automatizados hoje é `src/domain/`.

### 2. Store `stores/tabs.js` no renderer, substituindo `ui.js` e `graph.js`

Um `writable(initialTabsState())` com funções finas que aplicam as funções
do domínio (`openGraphTab`, `closeTab`, ...). Cada Graph Tab guarda
`{ id, kind: 'graph', title, path, graph: { nodes, edges, rootUnitId } }`,
em que `title` é o `unitName` da Project Unit escolhida (capitalização do
`.dpr`) e `path` é o `path` dela como declarado no `.dpr`.

`stores/ui.js` e `stores/graph.js` são removidas: `viewMode` vira
`activeId`, e a flag `graphRenderedStore` perde as duas funções que tinha
(esconder o Welcome e decidir se o modo `Selecionar Unit` fecha).

### 3. Todas as Tabs montadas; as inativas escondidas com `visibility: hidden`

`App.svelte` renderiza um painel por Tab dentro de uma área de conteúdo
`position: relative`, cada painel com `position: absolute; inset: 0`. Os
painéis inativos recebem `visibility: hidden` e `pointer-events: none`.

*Alternativas consideradas*:
- `{#if}` só para a Tab ativa: desmonta a `GraphView` e perde posições,
  zoom e View Filter, que a spec exige preservar.
- `display: none`: o container do `vis-network` fica com tamanho 0, e ao
  voltar o canvas precisa ser redimensionado e pode perder o enquadramento.
  Com `visibility: hidden` o container mantém o tamanho real e acompanha o
  redimensionamento da janela mesmo inativo (o `autoResize` do
  `vis-network` continua funcionando), o que cobre o cenário de
  redimensionar com a Graph Tab inativa.

### 4. `GraphView` recebe o grafo como prop e renderiza na montagem

`GraphView` passa a receber `graph` (`{ nodes, edges, rootUnitId }`) e chama
`networkRenderer.renderGraph(...)` no `onMount`, logo depois de
`initialize()`. O método exportado `renderGraph` e os `style.display`
imperativos saem. O painel de View Filter passa de `position: fixed` para
`position: absolute` dentro de `.graph-container`, ficando no canto superior
direito da área da Tab, abaixo da barra, e some junto com o painel da Tab
quando ela fica inativa. Cada instância já tem seus próprios
`interfaceVisible`/`implementationVisible`/`externalVisible`, então o View
Filter independente por Graph Tab sai da decisão 3 sem código extra.

### 5. A paleta delega a escolha da Root Unit para o `App`

`CommandPalette` deixa de conhecer a `GraphView` e o
`graphRenderedStore`. Em `selectRootUnit(projectUnit)` ela fecha a paleta e
chama o callback injetado `onRootUnitSelected(projectUnit)`. O `App`:

1. calcula o id da Graph Tab a partir do nome da unit (em minúsculas) e,
   se ela já estiver aberta, só a ativa, sem IPC;
2. senão chama `expandFromRootUnit` (mesmos argumentos que a paleta monta
   hoje) e faz `openGraphTab` com o resultado.

Se a chamada falhar, o `App` mostra um alerta com o nome da unit e não abre
Graph Tab. Se outro Project for carregado enquanto a chamada está em
andamento (o objeto em `projectStore` mudou), o resultado é descartado, para
que uma Graph Tab do Project anterior não apareça depois de
`closeGraphTabs`.

O id do passo 1 é calculado por uma função do domínio de Tabs
(`graphTabId(unitName)`), que usa a mesma regra de `expandDependencyGraph`
para o `rootUnitId`, de modo que dá para saber o id antes da chamada IPC.

A opção `closable` e o estado "não-fechável" saem da paleta: o modo
`Selecionar Unit` fica sempre fechável, e `Esc` volta à lista de Commands
só quando a entrada foi pelo Command (`entry: 'palette'`), como já é hoje.
`configureCommandPalette` deixa de receber `graphViewComponent`.

### 6. Atalhos de Tab num `keydown` no `window`, no renderer

O `App` registra um listener de `keydown` no `window` (fase de captura) que
trata:

- `Cmd+W` no macOS / `Ctrl+W` no Linux (pelo `platform` já exposto no
  preload): `closeTab(activeId)`;
- `Ctrl+Tab` / `Ctrl+Shift+Tab` nas duas plataformas: `nextTab` /
  `previousTab`.

Quando trata a tecla, o listener chama `preventDefault()`. Ele ignora tudo
enquanto a Command Palette estiver aberta: a `CommandPalette` passa a
exportar `isPaletteOpen()` (o nome `isOpen` já é do estado interno) e o serviço
`services/commandPalette.js` o expõe como `isCommandPaletteOpen()`.

O menu nativo não tem `role: 'close'` nem item com `CmdOrCtrl+W`, então
nada no main consome essa tecla, e a janela nunca fecha por ela.

*Alternativa considerada*: tratar no `before-input-event` do main, como a
sequência `Cmd/Ctrl+K R` (`main/keySequence.js`). Rejeitada porque o estado
das Tabs vive no renderer: seria preciso um evento IPC por atalho só para
devolver a ação ao renderer. A sequência `Cmd/Ctrl+K R` precisa do main
porque um acelerador de menu não expressa acordes, o que não é o caso aqui.

### 7. Command `showWelcome` e menu `Ajuda`, seguindo o caminho dos outros Commands

- `domain/commands`: novo item `{ id: 'showWelcome', label: 'Bem-vindo' }`
  no fim de `COMMANDS`, sem `shortcut` nem `requiresProject`.
- `main/commands.js`: `runCommand('showWelcome')` envia `app:show-welcome`.
- `main/menu.js`: novo menu `{ label: 'Ajuda', submenu: [{ label:
  labelOf('showWelcome'), click: () => run('showWelcome') }] }` depois de
  `{ role: 'viewMenu' }`.
- `preload/api.js`: `onShowWelcome(cb)`.
- `App.svelte`: `onShowWelcome` faz `openWelcomeTab`.
- Na paleta, `Bem-vindo` segue o caminho padrão (fecha a paleta e chama
  `runCommand` via `commands:run`), sem exceção como as de `Abrir recente` e
  `Selecionar Unit`.

*Alternativa considerada*: tratar `showWelcome` dentro do renderer, sem
IPC, quando disparado pela paleta. Rejeitada para manter `runCommand` como
ponto único de execução de Commands, como o `CLAUDE.md` descreve. O custo é
uma ida e volta de IPC sem efeito perceptível.

### 8. `onProjectLoaded` fecha as Graph Tabs

O listener faz `projectStore.set(project)`, `closeGraphTabs()` e depois
`enterRootUnitMode(..., { entry: 'direct' })`. Como `app:project-loaded` só
é enviado depois de um parse bem-sucedido, cancelar o diálogo ou falhar ao
ler o `.dpr` não mexe nas Tabs, sem nenhum código extra.

### 9. Barra de Tabs como componente próprio (`TabBar.svelte`)

Recebe as Tabs, o `activeId` e `canCloseTab`, e emite `activate(id)` e
`close(id)`. Fica numa única linha (`overflow-x: auto`, `white-space:
nowrap`, abas com largura mínima) e, quando `activeId` muda, chama
`scrollIntoView({ inline: 'nearest' })` na aba ativa. O `title` (tooltip)
da aba de uma Graph Tab é o `path`. O clique no "x" não propaga para o
clique de ativar.

## Risks / Trade-offs

- [Muitas Graph Tabs abertas mantêm várias instâncias do `vis-network` em
  memória] → Aceitável para o tamanho de projetos Delphi típicos. Se pesar,
  dá para destruir o canvas das Tabs inativas e guardar só posições e
  View Filter, sem mudar a spec.
- [A simulação de física de uma Graph Tab recém-aberta continua rodando se
  o usuário trocar de Tab antes de estabilizar] → Ela para sozinha em
  `stabilizationIterationsDone`, como hoje. Só custa CPU por alguns
  instantes.
- [Algum gerenciador de janelas do Linux pode capturar `Ctrl+Tab` antes do
  app] → Fora do controle do app. O "x" e o clique nas abas continuam
  funcionando.
- [`visibility: hidden` ainda deixa o conteúdo inativo na árvore de
  acessibilidade em alguns casos] → Adicionar `aria-hidden` /`inert` nos
  painéis inativos.

## Migration Plan

Não há dados persistidos para migrar: as Tabs não são guardadas e os Recent
Projects não mudam. Depois da implementação, atualizar o `CLAUDE.md`
(stores, fluxo de dados nos passos 3 a 6, menu `Ajuda`, evento
`app:show-welcome`, `onShowWelcome` no preload).
