# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Electron desktop app that visualizes the dependency graph of Pascal units. The
user opens a `.pas` file, the app parses its `unit` name and `uses` clause, then
renders a directed graph (via the `vis-network`/`vis-data` libraries) with an
edge from the unit to each dependency. It can also open a Delphi `.dpr`
project, let the user pick a Root Unit, and recursively expand the dependency
graph from there.

## Commands

- `npm start` — launch the Electron app in dev mode (`electron-forge start`, Vite dev server + HMR)
- `npm test` — run all tests (Vitest projects: `node` for `src/domain/test/` and `src/main/test/`, `renderer` — jsdom — for `src/renderer/**/*.test.js`)
- `npm run test:watch` — run tests in watch mode
- `npx vitest run src/domain/test/parsePascalSource.test.js` — run a single test file
- `npx vitest run -t "get the unit name"` — run a single test by name
- `npm run package` — build a production bundle without creating installers
- `npm run make` — build platform installers (not configured/exercised beyond the Forge defaults)

## Architecture

Electron Forge + Vite scaffold (`create-electron-app@latest --template=vite`),
with three processes split into their own folders under `src/`: `main/`
(main), `preload/` (preload), and `renderer/` + `index.html` (renderer). The
app is split into that Electron process layer and a pure parsing layer
(`src/domain/`). The domain layer has no Electron dependency, which is why
it's the part covered by tests (see
`docs/adr/0002-src-layout-main-preload-renderer-domain.md` for why this
layout — plain JavaScript, no UI framework, no `shared/` — was chosen).

- `src/main/index.js`: creates the `BrowserWindow`, registers the IPC
  handlers from `main/ipc/`, wires the `Cmd/Ctrl+K R` key sequence (see
  below) on the window's `before-input-event`, and builds the menu via
  `main/menu.js`.
- `src/main/ipc/{project,graph,commands}.js`: one module per IPC domain —
  `project.js` (`loadProject`/`performOpenProject`, and the `openProject`,
  `recentProjects:list` and `recentProjects:open` handlers), `graph.js`
  (`performExpandFromRootUnit`/`expandFromRootUnit`), `commands.js`
  (`registerCommandsHandler`: the `commands:run` handler, which calls
  `runCommand` with the caller's `event.sender`). `project.js` also
  exports `performOpenProject` so `menu.js` can reuse the same logic for
  the native `Arquivo` menu. `loadProject(filePath)` reads + parses the
  `.dpr` and, only after the parse succeeds, registers it as a Recent
  Project.
- `src/main/commands.js`: `runCommand(id, { webContents, performOpenProject })`
  — the single execution point of every Command (`openProject`,
  `selectUnit`, `selectMethod`, `openRecent`, `showWelcome`), shared by the native menu and
  the Command Palette. `openProject` runs the native dialog and pushes
  `app:project-loaded` only if a Project was chosen; `selectUnit` pushes
  `app:show-root-unit-selection`; `selectMethod` pushes
  `app:show-method-selection`; `openRecent` pushes `app:show-open-recent`;
  `showWelcome` pushes `app:show-welcome`. Unknown ids are ignored.
- `src/main/services/callIndexCache.js`: `createCallIndexCache({ build,
  readFile })` and the `callIndexCache` singleton — the only Project state the
  main process holds (ADR 0007). `loadProject` calls `setProject({ dprPath,
  projectDir, projectUnits })` after the `.dpr` parses; `getIndex()` builds the
  call index on first use (`buildCallIndex`, files read relative to
  `projectDir`), shares one build between concurrent requests and keeps it
  until the next `setProject` (no file watching). A build that finishes after
  another Project was loaded rejects with `[PROJECT_REPLACED]`; no Project →
  `[NO_PROJECT]`.
- `src/main/ipc/callGraph.js`: `registerCallGraphHandler` — `methods:list`
  (`unitName` → `{ methods: [{ id, label }], skipped? }`) and
  `callerGraph:expand` (`methodId` → `{ nodes, edges, skippedUnits }`, or
  `[METHOD_NOT_FOUND]`). Error codes travel as a `[CODE]` prefix in the
  message because Electron drops custom error properties.
- `src/main/ipc/tabs.js`: `registerActiveTabKindHandler` — listens to
  `tabs:active-kind` (sent by the renderer on every change of the active
  Tab) and enables the `selectMethod` menu item (`id: 'selectMethod'`,
  created disabled) only when the active Tab is a Unit Tab.
- `src/main/services/fileSystem.js`: thin wrapper around
  `fs.readFileSync(filePath, 'utf-8')`, used by both `ipc/` modules.
- `src/main/services/recentProjects.js`: `list()`/`add(path)`/`remove(path)`
  over `recent-projects.json` (a JSON array of `.dpr` paths) in
  `app.getPath('userData')`. A missing/invalid file reads as an empty list
  and write failures are swallowed. The ordering/dedupe/limit rules live in
  the pure `src/domain/recentProjects/` (also holds the dialog's
  `filterRecentProjects`/`describeRecentProject`).
- `src/main/keySequence.js`: `createKeySequence({ isMac, onComplete })`
  returns a handler for `before-input-event` inputs. Electron menu
  accelerators can't express a chord, so `Cmd+K` (macOS) / `Ctrl+K` arms the
  sequence for 1.5 s and is consumed; the next `R` (with or without the
  modifier still held — which also stops `Cmd+R` reloading) completes it and
  is consumed; any other non-modifier key or the timeout cancels it.
- `src/main/menu.js`: `buildMenu(mainWindow, { performOpenProject, platform })`
  — builds the native menu template: `Arquivo` (`Abrir projeto (.dpr)`, with
  the `CmdOrCtrl+O` accelerator — `Cmd+O` on macOS, `Ctrl+O` on Linux —,
  `Abrir recente` and `Sair`), `Edição` (`Selecionar Unit`, `Selecionar
  Método`), `Ferramentas` (`Paleta de Comandos`, `CmdOrCtrl+P`, which sends
  `app:show-command-palette`), `{ role: "viewMenu" }` and `Ajuda`
  (`Bem-vindo`). The `Arquivo` items, `Selecionar Unit`, `Selecionar Método`
  and `Bem-vindo` call `runCommand` by Command id and take their labels from the catalog in
  `domain/commands`. `Abrir recente` has no native
  accelerator; the `⌘K R` / `Ctrl+K R` hint is part of its label.
- `src/preload/index.js` + `src/preload/api.js`: `preload/api.js` is the
  plain object exposed on `window.pascalDependencyViewer` (including
  `platform`, the `process.platform` string the renderer uses to pick shortcut
  hints);
  `preload/index.js` is just the `contextBridge.exposeInMainWorld` call.
- `src/renderer/index.js`: minimal entrypoint that mounts `App.svelte` to
  `#app` in `index.html`.
- `src/renderer/components/App.svelte`: root component. Renders the
  `TabBar` and, below it, one panel per open Tab (`Welcome` for the Welcome
  Tab, its own `GraphView` for each Unit Tab and `CallerGraphView` for each
  Method Tab). Every panel stays mounted;
  inactive ones are hidden with `visibility: hidden` + `inert`, so each
  Unit/Method Tab keeps its View Filter, node positions and zoom. Sends
  `setActiveTabKind` on every change of the active Tab. Centralizes IPC
  listeners from `window.pascalDependencyViewer` (onProjectLoaded — which
  closes Unit and Method Tabs —, onShowCommandPalette, onShowOpenRecent,
  onShowRootUnitSelection, onShowWelcome, onShowMethodSelection — ignored
  unless a Unit Tab is active), handles the Method picked in the palette
  (activates its Method Tab if already open, otherwise calls
  `expandCallerGraph` and opens one; `[PROJECT_REPLACED]` and results that
  arrive after another Project was loaded are dropped silently, other errors
  alert), handles the Root Unit picked in the Command Palette
  (activates its Unit Tab if already open, otherwise calls
  `expandFromRootUnit` and opens one — or alerts on failure, and drops the
  result if another Project was loaded meanwhile) and the Tab shortcuts on a capturing
  `window` `keydown` (`Cmd+W` on macOS / `Ctrl+W` on Linux closes the active
  Tab, `Ctrl+Tab` / `Ctrl+Shift+Tab` cycle; all ignored while the palette is
  open). No menu item or Command exists for these shortcuts.
- `src/renderer/components/{Welcome,GraphView,CallerGraphView,CommandPalette,TabBar}.svelte`:
  Svelte components for the welcome screen, dependency graph visualization
  (via `vis-network`; receives its `graph` as a prop and renders it on
  mount), the Caller Graph of a Method Tab (`services/callerGraphRenderer.js`:
  hierarchical `DU` layout with levels from `assignCallerLevels`, no
  physics, no View Filter, no click actions; groups `target`/`block`/
  `entryPoint`/`method`, dashed and curved back-edges, purple Polymorphic
  Calls with a `via …` tooltip; plus a banner listing `skippedUnits`), the
  command palette (search/pick UI with four modes: Command list, Abrir
  recente, Selecionar Unit and Selecionar Método — the latter shows
  `Analisando Project…` while `listUnitMethods` is pending and drops
  responses that arrive out of context; always closable; see capabilities
  for details) and the Tab bar (single row, horizontal scroll, `×` hidden
  when the Tab can't be closed, Unit Tab tooltip = `.pas` path, Method Tab
  tooltip = `Unit — .pas path`).
- `src/renderer/stores/{project,tabs}.js`: reactive state (Svelte stores):
  `project.js` holds the loaded project; `tabs.js` holds the open Tabs, the
  active one and the activation order, applying the pure rules from
  `src/domain/tabs/`.
- `src/domain/tabs/`: pure Tab rules (kinds `welcome`, `unit`, `method`) —
  `initialTabsState`, `methodTabId` (`method:` + the Method id), `openMethodTab`, `unitTabId`
  (`unit:` + the lowercased unit name, same as `expandDependencyGraph`'s
  `rootUnitId`), `openWelcomeTab`, `openUnitTab` (activates instead of
  duplicating), `activateTab`, `closeTab` (activates the most recently used
  Tab; closing the last one reopens the Welcome Tab), `canCloseTab` (false
  only for a lone Welcome Tab), `closeProjectTabs` (Unit and Method Tabs)
  and `nextTab`/`previousTab`.
- `src/domain/{search,methodSelection,ipcErrors,callerLevels}/`:
  `normalizeForSearch`/`matchesSearch` (case- and accent-insensitive,
  shared by the palette filters), `filterMethods`, `ipcErrorCode` (extracts
  the `[CODE]` from an IPC error message) and `assignCallerLevels` (layer of
  each Caller Graph node: longest path to the Target Method, ignoring
  back-edges and self-loops).
- `src/domain/pascalParser/`: hand-written Delphi parser (ADR 0006) —
  `preprocess.js` (`{$IFDEF}`/`{$IF}` with a fixed set of default symbols,
  keeping line/column), `lexer.js` (tokens with line/column; comments and
  strings never yield identifiers) and `parser.js` (`parseSource` → Unit or
  Program AST; failures are `ParseError` with line/column).
- `src/domain/methods/`: `listUnitMethods(ast)` (routines with a body in the
  `implementation`, overloads merged, nested routines excluded) and the id
  format — `unit:<unit>|<class>|<name>` (lowercased), `program:<project>`,
  `init:<unit>`, `final:<unit>`.
- `src/domain/callIndex/`: `buildCallIndex({ dprPath, projectUnits,
  readFile })` — async, yields between Units, never reads External Units.
  `symbols.js` is the declarations pass (symbol table, inheritance,
  generics, `resolveType`), `resolver.js` walks bodies resolving each
  receiver's type and reports direct calls, Polymorphic Calls (virtual and
  interface) and references (Entry Points); unresolved receivers produce
  nothing. `rtlStubs.js` holds Pascal stubs for the RTL containers, `dfm.js`
  reads text forms (handlers of ancestor forms apply to inherited forms).
- `src/domain/expandCallerGraph/`: pure DFS from a Target Method over the
  index (one node per Method/block, self-loops, back-edges, direct edge wins
  over polymorphic, deterministic order).
- `src/domain/commands/`: the Command catalog (`COMMANDS`: `openProject`,
  `openRecent`, `selectUnit`, `selectMethod`, `showWelcome`) plus the pure
  `availableCommands(commands, { hasProject, activeTabKind })` (`selectUnit`
  needs a Project, `selectMethod` a Unit Tab), `filterCommands` (case- and
  accent-insensitive substring) and `shortcutHint`.

**Process boundaries**: `contextIsolation: true` / `nodeIntegration: false` on
the `BrowserWindow` (`src/main/index.js`). The renderer never `require()`s
anything directly — `src/preload/api.js` exposes a narrow API on
`window.pascalDependencyViewer`: `openProject()`, `expandFromRootUnit(args)`,
`listRecentProjects()`, `openRecentProject(path)`, `runCommand(id)`,
`listUnitMethods(unitName)` and `expandCallerGraph(methodId)` (all
`ipcRenderer.invoke`), `setActiveTabKind(kind)` (`ipcRenderer.send` on
`tabs:active-kind`), plus `onProjectLoaded(cb)`, `onShowMethodSelection(cb)`,
`onShowRootUnitSelection(cb)`, `onShowOpenRecent(cb)`,
`onShowCommandPalette(cb)` and `onShowWelcome(cb)` listeners.

**Data flow**:

1. `Arquivo > Abrir projeto (.dpr)` (shortcut `CmdOrCtrl+O`, so the keyboard
   triggers the same `click` handler) is a native `Menu` item
   (`main/menu.js`); its `click` handler calls `runCommand('openProject')`
   (`main/commands.js`), which runs the dialog + parsing directly in the main
   process (`performOpenProject`, in `main/ipc/project.js`), then pushes the
   result to the renderer via `webContents.send('app:project-loaded',
   ...)` — only if a file was chosen. `Arquivo > Sair` (`role: "quit"`)
   closes the app.
2. `performOpenProject`: `parseDprSource` builds the list of Project Units
   from the `.dpr`, and the path is registered as a Recent Project.
   `Arquivo > Abrir recente` (or the `Cmd/Ctrl+K R` sequence) sends
   `app:show-open-recent` to the renderer, which opens the Command Palette
   directly in its recents mode: it fetches the list over
   `recentProjects:list` and shows it (filter, `↑`/`↓`/`Enter`/`Esc`,
   click). Picking an item calls `recentProjects:open`: the main
   process runs `loadProject` and pushes the same `app:project-loaded` event
   (so everything after step 2 is shared). If the file can't be read, it
   shows an error box, removes the entry from the persisted list and pushes
   nothing. The list isn't checked for missing files when the overlay opens.
3. Picking a Root Unit that has no Unit Tab yet calls `expandFromRootUnit`
   over IPC (one that already has a Unit Tab just activates it, with no
   IPC)
   (`main/ipc/graph.js`'s `ipcMain.handle('expandFromRootUnit', ...)` →
   `performExpandFromRootUnit`), which reads the needed `.pas` files from
   disk in the **main** process (not the renderer) and runs
   `expandDependencyGraph`.
4. The renderer opens a new Unit Tab at the end of the Tab bar, and its
   `GraphView` draws `{ nodes, edges }` with `vis-network`'s `Network` — no
   page reload involved; the same renderer session reacts to each IPC push.
   `app:project-loaded` closes every Unit Tab (and activates the Welcome
   Tab, reopening it if needed).
5. `Edição > Selecionar Unit`'s `click` handler (`main/menu.js`) just sends
   `mainWindow.webContents.send('app:show-root-unit-selection')`, with no
   payload — the renderer, not the main process, owns the Project's Unit list
   (the main only caches the call index, see `callIndexCache`). The renderer
   (`App.svelte`) keeps the last `{ projectUnits, projectDir }` received via
   `onProjectLoaded` in `projectStore`, and opens the Command Palette's
   `Selecionar Unit` mode with it (`enterRootUnitMode(projectUnits,
   projectDir, { entry: 'direct' })`) on `onShowRootUnitSelection`; if no
   Project has been opened yet in the session, the click is a no-op.
   `app:project-loaded` also opens this same mode automatically. The mode is
   always closable (`Esc`/click outside); the user then stays on the Welcome
   Tab with the Project loaded. `Edição > Selecionar Método` (enabled only
   with a Unit Tab active) goes through `runCommand('selectMethod')` →
   `app:show-method-selection`, and the renderer opens the palette's
   `Selecionar Método` mode (`entry: 'direct'`) for the active Unit Tab's
   Root Unit.
6. `Ferramentas > Paleta de Comandos` (shortcut `CmdOrCtrl+P`) sends
   `app:show-command-palette`, and the renderer opens the Command Palette in
   its Command list mode. The list is `availableCommands(COMMANDS, {
   hasProject, activeTabKind })` (so `Selecionar Unit` only shows up once a
   Project has been loaded in the session, and `Selecionar Método` only with a
   Unit Tab active) filtered by `filterCommands`, with the shortcut
   hint on each row. Choosing a Command closes the palette and calls
   `runCommand(id)` over `commands:run` (the same `runCommand` the menu
   uses — `Bem-vindo` included, which comes back as `app:show-welcome`),
   except `Abrir recente`, `Selecionar Unit` and `Selecionar Método`, which switch the
   palette to their own mode without any IPC and without closing it —
   `Selecionar Unit` reads the current Project straight from the renderer's
   own state via `getProject()` (see step 5) instead of round-tripping
   through `app:show-root-unit-selection`. If the native dialog opened by
   `Abrir projeto (.dpr)` is cancelled, nothing is pushed and the palette
   stays closed.

**Cross-process communication is IPC** (`ipcMain.handle`/`ipcRenderer.invoke`
for renderer-initiated calls, `webContents.send` for main-initiated pushes
from the menu or from the `Cmd/Ctrl+K R` key sequence, and `commands:run` for
Command Palette executions) — there is no
`electron-store`/shared-blob step (the only persisted state is the Recent
Projects JSON in `userData`) and no `reloadMainWindow()`; navigating between
the Command Palette's `Selecionar Unit` mode and the graph screen is just DOM
manipulation inside one page load.

**Graph shape convention** (`domain/expandDependencyGraph/index.js`): node
`id` is always lowercased (so edges match regardless of case) while `label`
keeps the original casing. Edges always point from the main unit `to` each
dependency and carry a `origin` (`interface`, `implementation`, or `both`,
per `domain/parsePascalSource/selectUsesFromSource.js`'s Uses Clause Origin
— see `CONTEXT.md`). When expanding from a Root Unit, nodes get a `group`
(`projectUnit` or `externalUnit`) used by the renderer's `vis-network`
options to style them differently.

## Svelte Setup

A partir da branch `feat/svelte`, o projeto integra **Svelte** como framework UI moderno, coexistindo com o código vanilla JavaScript existente. A estratégia é gradual: novos componentes são escritos em Svelte por padrão; componentes vanilla serão migrados incrementalmente em branches temáticas futuras, até atingir 100% Svelte.

### Estrutura de Componentes Svelte

- **`src/renderer/components/`**: Componentes vanilla (`.js`) e Svelte (`.svelte`) convivem aqui. Ao remover vanilla, a pasta conterá apenas Svelte.
- **`src/renderer/stores/`**: Estado reativo gerenciado com `svelte/store` nativo. Cada store (`project.js`, etc.) encapsula um domínio de estado e é alimentado pela IPC Bridge.
- **`src/renderer/services/`**: "IPC Bridges" — módulos que envolvem `ipcRenderer.invoke` com funções puras. Componentes Svelte chamam a Bridge, não IPC direto.

**Padrão de comunicação Svelte ↔ Main Process**:
1. Componente Svelte chama `src/renderer/services/ipc.js` (ex.: `openProject(path)`)
2. Bridge invoca `ipcRenderer.invoke('project:open', ...)` via `window.pascalDependencyViewer`
3. Main process responde; Bridge atualiza `src/renderer/stores/` (ex.: `projectStore`)
4. Componentes Svelte observam a store e re-renderizam reativamente

### Build e TypeScript

- **Vite**: `vite.renderer.config.mjs` inclui `vite-plugin-svelte`
- **TypeScript**: Componentes Svelte usam `<script lang="ts">` (opcional, gradual). `src/renderer/services/` e stores têm tipos TypeScript. Código vanilla permanece em JavaScript puro.
- **Testing**: Vitest + `@testing-library/svelte` para testes de componentes Svelte. Os testes de `src/domain/` e de `src/main/` também rodam no Vitest (`vi.fn`, `vi.doMock`); `npm test` roda tudo.
- **CSS**: Svelte `<style>` scoped (encapsulado por componente, padrão Svelte). Nenhuma dependência CSS global nova.

### Migração Gradual

Cada branch temática (ex.: `feat/migrate-command-palette-to-svelte`) migra **um** componente vanilla para Svelte. A ordem sugerida é:
1. `commandPalette.js` → `CommandPalette.svelte` (menor, menos dependências)
2. `graphView.js` → `GraphView.svelte` (mais complexo, maior ganho)

Após cada migração, o componente vanilla é deletado, a pasta não muda de estrutura.

### Exemplos de Padrão (Esta PR)

- **`src/renderer/services/ipc.js`**: Bridge com `openProject()`, demonstra padrão.
- **`src/renderer/stores/project.js`**: Store com estado de projeto, alimentado por IPC.
- **`src/renderer/components/Welcome.svelte`**: Componente validação, renderiza "Svelte is working!".

## Notes

- The Dependency Graph's parsing is regex-based (the Caller Graph uses the
  hand-written parser in `src/domain/pascalParser/`, ADR 0006);
  `selectUsesFromSource` always extracts both the
  `interface` and `implementation` `uses` clauses, tagging each unit with
  its Uses Clause Origin. There is no handling for a missing `unit`/`uses`
  clause — `.match(...)[0]` will throw on no match.
- `src/domain/**` (renamed from `src/model/**`) has no Electron dependency —
  it's plain ESM JavaScript, importable and testable on its own.
- `src/main/index.js` and `src/preload/index.js` share the same basename
  (`index`) but must compile to distinct filenames (`main.js`/`preload.js`)
  in the shared `.vite/build/` output directory — `vite.main.config.mjs`
  (`build.lib.fileName`) and `vite.preload.config.mjs`
  (`build.rollupOptions.output.entryFileNames`) pin those names explicitly,
  otherwise the two builds would silently overwrite each other.
- `mainWindow.webContents.openDevTools()` is conditioned on `!app.isPackaged`
  (was unconditional before the migration).

## Documentation language

- ADRs (`docs/adr/*.md`) and `CONTEXT.md` must be written in Brazilian
  Portuguese (pt-BR) — both when creating new entries and when editing
  existing ones.
- Keep the glossary terms defined in `CONTEXT.md` (`Unit`, `Project`,
  `Root Unit`, `Uses Clause Origin`, `View Filter`, etc.) in English, since
  they match the identifiers used in the code; the same goes for code
  identifiers, file paths, commands and other technical names.
- ADR file names stay in English kebab-case
  (`NNNN-short-title-in-english.md`), as other docs reference them by path.
