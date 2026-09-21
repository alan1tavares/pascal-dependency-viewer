## Context

Ver `proposal.md` para a motivação e `specs/` para o comportamento. Estado
atual relevante:

- O diálogo `Abrir recente` é o overlay `#openRecentOverlay` em `index.html`,
  dirigido por `src/renderer/components/openRecentDialog.js`
  (`showOpenRecentDialog()`), que já foi isolado para virar um modo de uma
  paleta. O evento `app:show-open-recent` (menu `Arquivo` e sequência
  `Cmd/Ctrl+K R`, tratada em `main/keySequence.js`) o abre.
- As ações do app são definidas duas vezes: o `click` de cada item de
  `src/main/menu.js` (`Abrir projeto (.dpr)` → `performOpenProject` +
  `app:project-loaded`; `Selecionar Unit` → `app:show-root-unit-selection`;
  `Abrir recente` → `app:show-open-recent`) e, onde existir, o handler no
  renderer. Não há um lugar único que liste "as ações do app".
- O main não guarda estado de Project; o renderer guarda `lastProject` em
  `src/renderer/index.js`, e é ele quem sabe se `Selecionar Unit` tem o que
  mostrar.
- `src/domain/` é ESM puro, sem Electron, e é onde vive a lógica testada;
  `src/main/test/` testa main com `electron` mockado.
- Aceleradores nativos do Electron cobrem `CmdOrCtrl+P`; só a sequência
  `Cmd/Ctrl+K R` precisa do `before-input-event`.

## Goals / Non-Goals

**Goals:**
- Uma única lista de Commands (rótulo, atalho, disponibilidade) e uma única
  execução por `id`, usadas tanto pelo menu quanto pela paleta.
- Reaproveitar o overlay e o comportamento do diálogo `Abrir recente` como
  modo da paleta, sem regressão para `Cmd/Ctrl+K R`.

**Non-Goals:**
- Novos Commands além dos três iniciais, histórico de uso, fuzzy matching,
  configuração de atalhos.
- Mover o estado de Project para o main.
- Remover ou renomear `app:show-open-recent`.

## Decisions

**1. Catálogo de Commands em `src/domain/commands/index.js`.**
Uma lista `COMMANDS` de `{ id, label, shortcut?, requiresProject? }` —
`openProject` (`Abrir projeto (.dpr)`, atalho `O`), `openRecent` (`Abrir
recente`, atalho `K R`) e `selectUnit` (`Selecionar Unit`,
`requiresProject: true`) — mais funções puras: `availableCommands(commands, {
hasProject })`, `filterCommands(commands, text)` (substring do rótulo,
ignorando maiúsculas e acentos via `normalize('NFD')` sem marcas
diacríticas) e `shortcutHint(command, isMac)` (`⌘O` / `Ctrl+O`, `⌘K R` /
`Ctrl+K R`). O domínio não sabe a plataforma: recebe `isMac`.
- Alternativas: lista própria no renderer chamando as APIs já expostas (deixa
  menu e paleta divergirem — descartada, decisão do usuário); catálogo no
  main exposto por IPC (o renderer precisaria de um round-trip só para
  listar rótulos que não mudam).

**2. Execução por `id` no main: `src/main/commands.js`.**
`runCommand(id, { webContents, performOpenProject })` faz:
- `openProject`: `await performOpenProject()`; se devolver Project,
  `webContents.send('app:project-loaded', project)` (o `click` atual do menu,
  movido para cá);
- `selectUnit`: `webContents.send('app:show-root-unit-selection')`;
- `openRecent`: `webContents.send('app:show-open-recent')`.
Um `id` desconhecido é ignorado. `src/main/ipc/commands.js` registra
`commands:run` (`ipcMain.handle`, `(event, id)` → `runCommand(id, { webContents:
event.sender, ... })`), seguindo "um módulo por domínio IPC"; `index.js` o
liga ao lado de `registerProjectHandler`/`registerGraphHandler`. Os itens
`Abrir projeto (.dpr)`, `Abrir recente` (menu `Arquivo`) e `Selecionar Unit`
(menu `Edição`) passam a chamar `runCommand` com o `mainWindow.webContents`,
mantendo rótulos, aceleradores e a dica `⌘K R` no rótulo como estão.
`Selecionar Método` e `Sair` continuam como estão.
- O main continua sem estado de Project: a decisão de esconder `Selecionar
  Unit` é do renderer (decisão 4).

**3. Menu `Ferramentas`.**
`buildMenu` ganha, entre `Edição` e `{ role: "viewMenu" }`, `{ label:
"Ferramentas", submenu: [{ label: "Paleta de Comandos", accelerator:
"CmdOrCtrl+P", click: () => mainWindow.webContents.send(
"app:show-command-palette") }] }` — mesmo padrão do `Cmd+O` (o acelerador
dispara o `click`). `app:show-command-palette` é um evento novo, sem payload,
exposto no preload como `onShowCommandPalette(cb)`.

**4. Um único componente de paleta no renderer: `commandPalette.js` absorve
`openRecentDialog.js`.**
`src/renderer/components/commandPalette.js` substitui
`openRecentDialog.js` e o overlay `#openRecent*` de `index.html` vira
`#commandPalette*` (mesmo estilo). Estado: `mode` (`commands` |
`recents`) e, no modo recentes, `recentsEntry` (`palette` | `direct`).
- `showCommandPalette()` (evento `app:show-command-palette`, `Cmd/Ctrl+P`):
  abre no modo `commands`; se já aberta, volta ao modo `commands`, limpa o
  input e devolve o foco.
- `showOpenRecent()` (evento `app:show-open-recent`): abre ou troca para o
  modo `recents` com `recentsEntry = 'direct'`.
- Modo `commands`: sem prefixo (o `<span>` do prefixo fica oculto), placeholder
  `Digite um comando`, lista de `filterCommands(availableCommands(COMMANDS,
  { hasProject }), texto)` com o rótulo e, à direita, `shortcutHint`. `Enter`
  ou clique: `openRecent` troca para `recents` com `recentsEntry = 'palette'`
  (local, sem IPC); qualquer outro Command fecha a paleta e chama
  `api.runCommand(id)`.
- Modo `recents`: o comportamento atual do diálogo (prefixo fixo, lista de
  Recent Projects, filtro, `↑`/`↓`/`Enter`). `Esc` volta ao modo `commands`
  se `recentsEntry === 'palette'`, senão fecha.
- `hasProject` vem de `renderer/index.js` (`() => lastProject !== null`) e é
  lido na hora de montar a lista, sem cache.
- A plataforma para `shortcutHint` vem de `api.platform` (novo campo do
  preload, `process.platform`), o mesmo critério `darwin` do `menu.js`.
- Alternativas: manter dois overlays separados (duplica estilo e teclado, e
  a troca `Abrir recente` viraria fechar-e-abrir); framework de UI (fora do
  padrão do projeto, ver ADR 0002).

**5. Reuso do que já existe.** `filterRecentProjects`/`describeRecentProject`
e os canais `recentProjects:list`/`recentProjects:open` não mudam; a troca
para o modo recentes só reaproveita o que `openRecentDialog.js` já fazia.

## Risks / Trade-offs

- [`Cmd/Ctrl+P` com a paleta aberta no modo recentes volta à lista de
  Commands, decisão não explicitada na conversa] → registrada na spec
  (`command-palette`); é o comportamento esperado de "abrir a paleta".
- [`Cmd+O` com a paleta aberta abre o diálogo nativo e, ao carregar, a paleta
  ficaria por cima da nova tela] → o renderer fecha a paleta ao receber
  `app:project-loaded`.
- [Rótulos e dicas de atalho dos Commands duplicados entre catálogo e itens
  de menu] → os itens do menu chamam `runCommand` pelo `id`, e um teste de
  menu confere que os rótulos do `Arquivo`/`Edição` batem com o catálogo.
- [Conflito de `Cmd/Ctrl+P` com atalhos do Chromium] → nenhum atalho do app
  usa essa combinação; o acelerador nativo do menu tem prioridade sobre o
  atalho padrão de imprimir do Chromium, que o app não expõe.
- [Ocultar `Selecionar Unit` sem Project esconde uma ação, enquanto o menu a
  mantém como no-op] → intencional, e deixa a lista honesta (decisão do
  usuário).

## Migration Plan

Nenhuma migração: sem dados persistidos novos. `app:show-open-recent`
permanece, então `Cmd/Ctrl+K R` e `Arquivo > Abrir recente` seguem iguais para
o usuário. Rollback é reverter a mudança.
