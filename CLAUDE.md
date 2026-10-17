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
- `npm test` — run all tests (Vitest for domínio + componentes Svelte)
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
  `selectUnit`, `openRecent`, `showWelcome`), shared by the native menu and
  the Command Palette. `openProject` runs the native dialog and pushes
  `app:project-loaded` only if a Project was chosen; `selectUnit` pushes
  `app:show-root-unit-selection`; `openRecent` pushes `app:show-open-recent`;
  `showWelcome` pushes `app:show-welcome`. Unknown ids are ignored.
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
  (`Bem-vindo`). The `Arquivo` items, `Selecionar Unit` and `Bem-vindo` call
  `runCommand` by Command id and take their labels from the catalog in
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
  Tab, its own `GraphView` for each Graph Tab). Every panel stays mounted;
  inactive ones are hidden with `visibility: hidden` + `inert`, so each
  Graph Tab keeps its View Filter, node positions and zoom. Centralizes IPC
  listeners from `window.pascalDependencyViewer` (onProjectLoaded,
  onShowCommandPalette, onShowOpenRecent, onShowRootUnitSelection,
  onShowWelcome), handles the Root Unit picked in the Command Palette
  (activates its Graph Tab if already open, otherwise calls
  `expandFromRootUnit` and opens one — or alerts on failure, and drops the
  result if another Project was loaded meanwhile) and the Tab shortcuts on a capturing
  `window` `keydown` (`Cmd+W` on macOS / `Ctrl+W` on Linux closes the active
  Tab, `Ctrl+Tab` / `Ctrl+Shift+Tab` cycle; all ignored while the palette is
  open). No menu item or Command exists for these shortcuts.
- `src/renderer/components/{Welcome,GraphView,CommandPalette,TabBar}.svelte`:
  Svelte components for the welcome screen, dependency graph visualization
  (via `vis-network`; receives its `graph` as a prop and renders it on
  mount), the command palette (search/pick UI with three modes: Command list,
  Abrir recente, and Selecionar Unit — always closable; see capabilities for
  details) and the Tab bar (single row, horizontal scroll, `×` hidden when
  the Tab can't be closed, Graph Tab tooltip = `.pas` path).
- `src/renderer/stores/{project,tabs}.js`: reactive state (Svelte stores):
  `project.js` holds the loaded project; `tabs.js` holds the open Tabs, the
  active one and the activation order, applying the pure rules from
  `src/domain/tabs/`.
- `src/domain/tabs/`: pure Tab rules — `initialTabsState`, `graphTabId`
  (`graph:` + the lowercased unit name, same as `expandDependencyGraph`'s
  `rootUnitId`), `openWelcomeTab`, `openGraphTab` (activates instead of
  duplicating), `activateTab`, `closeTab` (activates the most recently used
  Tab; closing the last one reopens the Welcome Tab), `canCloseTab` (false
  only for a lone Welcome Tab), `closeGraphTabs` and `nextTab`/`previousTab`.
- `src/domain/commands/`: the Command catalog (`COMMANDS`: `openProject`,
  `openRecent`, `selectUnit`, `showWelcome`) plus the pure `availableCommands`
  (`selectUnit` needs a Project), `filterCommands` (case- and
  accent-insensitive substring) and `shortcutHint`.

**Process boundaries**: `contextIsolation: true` / `nodeIntegration: false` on
the `BrowserWindow` (`src/main/index.js`). The renderer never `require()`s
anything directly — `src/preload/api.js` exposes a narrow API on
`window.pascalDependencyViewer`: `openProject()`, `expandFromRootUnit(args)`,
`listRecentProjects()`, `openRecentProject(path)` and `runCommand(id)` (all
`ipcRenderer.invoke`), plus `onProjectLoaded(cb)`,
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
3. Picking a Root Unit that has no Graph Tab yet calls `expandFromRootUnit`
   over IPC (one that already has a Graph Tab just activates it, with no
   IPC)
   (`main/ipc/graph.js`'s `ipcMain.handle('expandFromRootUnit', ...)` →
   `performExpandFromRootUnit`), which reads the needed `.pas` files from
   disk in the **main** process (not the renderer) and runs
   `expandDependencyGraph`.
4. The renderer opens a new Graph Tab at the end of the Tab bar, and its
   `GraphView` draws `{ nodes, edges }` with `vis-network`'s `Network` — no
   page reload involved; the same renderer session reacts to each IPC push.
   `app:project-loaded` closes every Graph Tab (and activates the Welcome
   Tab, reopening it if needed).
5. `Edição > Selecionar Unit`'s `click` handler (`main/menu.js`) just sends
   `mainWindow.webContents.send('app:show-root-unit-selection')`, with no
   payload — the main process holds no Project state. The renderer
   (`App.svelte`) keeps the last `{ projectUnits, projectDir }` received via
   `onProjectLoaded` in `projectStore`, and opens the Command Palette's
   `Selecionar Unit` mode with it (`enterRootUnitMode(projectUnits,
   projectDir, { entry: 'direct' })`) on `onShowRootUnitSelection`; if no
   Project has been opened yet in the session, the click is a no-op.
   `app:project-loaded` also opens this same mode automatically. The mode is
   always closable (`Esc`/click outside); the user then stays on the Welcome
   Tab with the Project loaded. `Edição > Selecionar Método` just shows a
   `dialog.showMessageBox` placeholder alert — no IPC, no renderer state
   change.
6. `Ferramentas > Paleta de Comandos` (shortcut `CmdOrCtrl+P`) sends
   `app:show-command-palette`, and the renderer opens the Command Palette in
   its Command list mode. The list is `availableCommands(COMMANDS, {
   hasProject })` (so `Selecionar Unit` only shows up once a Project has been
   loaded in the session) filtered by `filterCommands`, with the shortcut
   hint on each row. Choosing a Command closes the palette and calls
   `runCommand(id)` over `commands:run` (the same `runCommand` the menu
   uses — `Bem-vindo` included, which comes back as `app:show-welcome`),
   except `Abrir recente` and `Selecionar Unit`, which switch the
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
- **Testing**: Vitest + `@testing-library/svelte` para testes de componentes Svelte. Jest continua para `src/domain/`. `npm test` roda ambos.
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

- Parsing is regex-based; `selectUsesFromSource` always extracts both the
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
