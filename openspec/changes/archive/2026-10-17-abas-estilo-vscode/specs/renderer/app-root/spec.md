# Spec Delta

## ADDED Requirements

### Requirement: App renderiza a barra de Tabs e o conteúdo de cada Tab
O App SHALL renderizar a barra de Tabs e, abaixo dela, o conteúdo de todas
as Tabs abertas: o Welcome para a Welcome Tab e uma instância própria de
GraphView para cada Graph Tab. Só o conteúdo da Tab ativa SHALL ficar
visível e interativo; os demais SHALL continuar montados, preservando seu
estado. CommandPalette SHALL sempre estar renderizado como overlay.

#### Scenario: Renderização inicial
- **WHEN** App.svelte é montado
- **THEN** a barra de Tabs exibe só a Welcome Tab, ativa, e o Welcome é o
  único conteúdo visível

#### Scenario: Uma GraphView por Graph Tab
- **WHEN** as Graph Tabs `UnitA` e `UnitB` estão abertas e `UnitB` está ativa
- **THEN** existem duas instâncias de GraphView montadas, só a de `UnitB` é
  visível, e a de `UnitA` mantém seu estado sem ser desmontada

#### Scenario: CommandPalette sobre qualquer Tab
- **WHEN** qualquer Tab está ativa
- **THEN** CommandPalette pode ser aberto/fechado como modal overlay,
  independente da Tab ativa

### Requirement: Estado das Tabs numa store do renderer
O App SHALL manter as Tabs abertas, a Tab ativa e a ordem de ativação numa
Svelte Store do renderer, alimentada pelas ações do usuário e pelos
listeners IPC. O main process SHALL não guardar estado de Tabs.

#### Scenario: Escolha de Root Unit atualiza a store
- **WHEN** o usuário escolhe a Root Unit `UnitA` no modo `Selecionar Unit`
- **THEN** a store de Tabs passa a conter a Graph Tab `UnitA`, ativa, e a
  barra de Tabs reflete a mudança

### Requirement: Atalhos de teclado das Tabs tratados no renderer
O App SHALL tratar no próprio renderer os atalhos `Cmd/Ctrl+W`, `Ctrl+Tab`
e `Ctrl+Shift+Tab` (capability `tabs`), sem passar pelo main process, e
SHALL impedir o comportamento padrão dessas teclas quando as tratar.

#### Scenario: Cmd/Ctrl+W tratado no renderer
- **WHEN** a Graph Tab `UnitA` está ativa, a Command Palette está fechada e
  o usuário pressiona `Cmd/Ctrl+W`
- **THEN** o App fecha a Tab `UnitA` sem nenhuma chamada IPC

## MODIFIED Requirements

### Requirement: App centraliza listeners IPC do main process

O App SHALL registrar e gerenciar todos os listeners IPC (onProjectLoaded, onShowCommandPalette, onShowOpenRecent, onShowRootUnitSelection, onShowWelcome) em seu onMount, removendo essa responsabilidade de index.js. Quando um evento é recebido, App SHALL executar a ação apropriada (atualizar stores, chamar métodos de filhos).

#### Scenario: Listener onProjectLoaded
- **WHEN** main process dispara `webContents.send('app:project-loaded', { projectUnits, projectDir })`
- **THEN** App atualiza `projectStore`, fecha todas as Graph Tabs, ativa a Welcome Tab (abrindo-a se estava fechada) e abre CommandPalette no modo Root Unit Selection

#### Scenario: Listener onShowCommandPalette
- **WHEN** main process dispara `webContents.send('app:show-command-palette')`
- **THEN** App chama método `commandPaletteComponent.showCommandPalette()` para abrir a paleta em modo Commands

#### Scenario: Listener onShowOpenRecent
- **WHEN** main process dispara `webContents.send('app:show-open-recent')`
- **THEN** App chama `commandPaletteComponent.showOpenRecent()` para abrir paleta em modo Recentes

#### Scenario: Listener onShowRootUnitSelection
- **WHEN** main process dispara `webContents.send('app:show-root-unit-selection')`
- **THEN** App chama `commandPaletteComponent.enterRootUnitMode()` para abrir paleta em modo seleção de Unit

#### Scenario: Listener onShowWelcome
- **WHEN** main process dispara `webContents.send('app:show-welcome')`
- **THEN** App ativa a Welcome Tab, abrindo-a no fim da barra se estava fechada

## REMOVED Requirements

### Requirement: App renderiza Welcome ou GraphView conforme viewMode
**Reason**: Com as Tabs, Welcome e várias GraphViews ficam montados ao mesmo
tempo, e o que decide o conteúdo visível é a Tab ativa, não um enum de duas
vistas.
**Migration**: Substituído por "App renderiza a barra de Tabs e o conteúdo
de cada Tab".

### Requirement: App gerencia referências de componentes filhos via bind:this
**Reason**: Com uma GraphView por Graph Tab não existe mais uma única
referência para chamar `renderGraph()`. Cada GraphView recebe o seu
Dependency Graph ao ser montada.
**Migration**: A escolha de uma Root Unit atualiza a store de Tabs com o
grafo calculado, e a GraphView da nova Graph Tab o renderiza na montagem.
A CommandPalette continua sendo acionada pelo serviço que já a envolve.

### Requirement: viewMode store gerencia transições
**Reason**: O estado de vista passa a ser a lista de Tabs e a Tab ativa.
**Migration**: Substituído por "Estado das Tabs numa store do renderer".
