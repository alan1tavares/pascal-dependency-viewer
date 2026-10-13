# renderer/app-root Specification

## Purpose
O componente raiz (App.svelte) orquestra todos os sub-componentes Svelte (Welcome, GraphView, CommandPalette), centraliza listeners IPC do main process, e gerencia transições entre vistas.

## Requirements

### Requirement: App renderiza Welcome ou GraphView conforme viewMode

O App SHALL renderizar o componente Welcome quando `viewMode === 'welcome'` e GraphView quando `viewMode === 'graph'`, nunca ambos simultaneamente. CommandPalette SHALL sempre estar renderizado (como overlay modal).

#### Scenario: Renderização inicial com Welcome
- **WHEN** App.svelte é montado
- **THEN** viewMode inicia como 'welcome' e apenas Welcome é visível na tela

#### Scenario: Transição para GraphView após carregar projeto
- **WHEN** um projeto é carregado via IPC (onProjectLoaded)
- **THEN** viewMode muda para 'graph' e GraphView torna-se visível, Welcome desaparece

#### Scenario: CommandPalette sempre visível
- **WHEN** App está em qualquer viewMode
- **THEN** CommandPalette pode ser aberto/fechado como modal overlay, independente da vista ativa

### Requirement: App centraliza listeners IPC do main process

O App SHALL registrar e gerenciar todos os listeners IPC (onProjectLoaded, onShowCommandPalette, onShowOpenRecent, onShowRootUnitSelection) em seu onMount, removendo essa responsabilidade de index.js. Quando um evento é recebido, App SHALL executar a ação apropriada (atualizar stores, chamar métodos de filhos).

#### Scenario: Listener onProjectLoaded
- **WHEN** main process dispara `webContents.send('app:project-loaded', { projectUnits, projectDir })`
- **THEN** App atualiza `projectStore` e muda `viewMode` para 'graph', preparando CommandPalette para modo Root Unit Selection

#### Scenario: Listener onShowCommandPalette
- **WHEN** main process dispara `webContents.send('app:show-command-palette')`
- **THEN** App chama método `commandPaletteComponent.showCommandPalette()` para abrir a paleta em modo Commands

#### Scenario: Listener onShowOpenRecent
- **WHEN** main process dispara `webContents.send('app:show-open-recent')`
- **THEN** App chama `commandPaletteComponent.showOpenRecent()` para abrir paleta em modo Recentes

#### Scenario: Listener onShowRootUnitSelection
- **WHEN** main process dispara `webContents.send('app:show-root-unit-selection')`
- **THEN** App chama `commandPaletteComponent.enterRootUnitMode()` para abrir paleta em modo seleção de Unit

### Requirement: App gerencia referências de componentes filhos via bind:this

O App SHALL usar `bind:this` para capturar referências aos componentes filhos (graphViewComponent, commandPaletteComponent) permitindo chamadas diretas a métodos como `renderGraph()`, `showCommandPalette()`, etc.

#### Scenario: Acesso a métodos do GraphView
- **WHEN** App precisa renderizar um grafo após seleção de Root Unit
- **THEN** App chama `graphViewComponent.renderGraph(nodes, edges, rootUnit)` com dados recebidos do main process

#### Scenario: Acesso a métodos do CommandPalette
- **WHEN** App recebe evento IPC de show/hide paleta
- **THEN** App chama métodos apropriados em `commandPaletteComponent` (showCommandPalette, showOpenRecent, enterRootUnitMode)

### Requirement: App não expõe métodos públicos para index.js

O App SHALL ser uma caixa preta opaca — index.js apenas monta o componente, sem chamar métodos nele. Toda a lógica de orquestração fica encapsulada dentro de App.svelte, acionada apenas por listeners IPC.

#### Scenario: index.js minimalista
- **WHEN** index.js carrega
- **THEN** index.js cumpre apenas 3 passos: importa App, obtém elemento `#app` do DOM, chama `new App({ target })`

#### Scenario: Sem métodos públicos expostos
- **WHEN** App é montado
- **THEN** index.js nunca chama métodos no App (type: typeof App === 'function', sem export de métodos nele)

### Requirement: viewMode store gerencia transições

O App SHALL usar store `viewMode` para rastrear estado da vista ('welcome' | 'graph'), permitindo que qualquer componente (ou teste futuro) leia e reaja a mudanças de vista sem acoplamento direto.

#### Scenario: viewMode reativo em transição
- **WHEN** App muda `viewMode` de 'welcome' para 'graph'
- **THEN** todos os subscribers da store (Welcome, GraphView via $viewMode) recebem atualização e re-renderizam condicionalmente

#### Scenario: viewMode persiste durante sessão
- **WHEN** app passa por múltiplas aberturas/fechamentos de CommandPalette
- **THEN** viewMode não muda para 'welcome' (apenas muda ao comando explícito ou fechamento de projeto)
