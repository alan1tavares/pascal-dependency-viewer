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
- `npm test` — run the Jest test suite
- `npx jest src/domain/test/parsePascalSource.test.js` — run a single test file
- `npx jest -t "get the unit name"` — run a single test by name
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
  `selectUnit`, `openRecent`), shared by the native menu and the Command
  Palette. `openProject` runs the native dialog and pushes
  `app:project-loaded` only if a Project was chosen; `selectUnit` pushes
  `app:show-root-unit-selection`; `openRecent` pushes `app:show-open-recent`.
  Unknown ids are ignored.
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
  `app:show-command-palette`), and `{ role: "viewMenu" }`. The `Arquivo`
  items and `Selecionar Unit` call `runCommand` by Command id and take their
  labels from the catalog in `domain/commands`. `Abrir recente` has no native
  accelerator; the `⌘K R` / `Ctrl+K R` hint is part of its label.
- `src/preload/index.js` + `src/preload/api.js`: `preload/api.js` is the
  plain object exposed on `window.pascalDependencyViewer` (including
  `platform`, the `process.platform` string the renderer uses to pick shortcut
  hints);
  `preload/index.js` is just the `contextBridge.exposeInMainWorld` call.
- `src/renderer/index.js` + `src/renderer/components/{graphView,commandPalette}.js`:
  `index.js` is the entrypoint (wires the IPC listeners below, configures the
  palette via `configureCommandPalette({ hasProject, getProject,
  onRootUnitSelected })`, and tracks `hasRenderedGraphForCurrentProject` per
  Project); `graphView.js` renders the `vis-network` graph; `commandPalette.js`
  drives the Command Palette overlay (markup/styles live in `index.html`) —
  the single search/pick UI for the whole app, with three modes: the Command
  list (`Digite um comando`, no prefix), `Abrir recente` (Recent Projects,
  fixed `Abrir recente` prefix) and `Selecionar Unit` (the Root Unit
  search/listing, no prefix — see capability `root-unit-selection`). `Esc` in
  a non-Command mode goes back to the Command list when that mode was entered
  through its own Command in the list (`Abrir recente`/`Selecionar Unit`),
  and closes the palette entirely when entered by menu/atalho (`Cmd/Ctrl+K R`,
  or `Edição > Selecionar Unit`); clicking outside the card always closes the
  palette entirely, regardless of how the mode was entered. The `Selecionar
  Unit` mode opened automatically right after a Project loads (before any
  Root Unit has been chosen for it) is additionally marked non-closable:
  `Esc`, clicking outside, and the `Cmd/Ctrl+P`/`Cmd/Ctrl+K R` shortcuts all
  have no effect until a Root Unit is chosen.
- `src/domain/commands/`: the Command catalog (`COMMANDS`: `openProject`,
  `openRecent`, `selectUnit`) plus the pure `availableCommands`
  (`selectUnit` needs a Project), `filterCommands` (case- and
  accent-insensitive substring) and `shortcutHint`.

**Process boundaries**: `contextIsolation: true` / `nodeIntegration: false` on
the `BrowserWindow` (`src/main/index.js`). The renderer never `require()`s
anything directly — `src/preload/api.js` exposes a narrow API on
`window.pascalDependencyViewer`: `openProject()`, `expandFromRootUnit(args)`,
`listRecentProjects()`, `openRecentProject(path)` and `runCommand(id)` (all
`ipcRenderer.invoke`), plus `onProjectLoaded(cb)`,
`onShowRootUnitSelection(cb)`, `onShowOpenRecent(cb)` and
`onShowCommandPalette(cb)` listeners.

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
3. Clicking a Root Unit in the renderer calls `expandFromRootUnit` over IPC
   (`main/ipc/graph.js`'s `ipcMain.handle('expandFromRootUnit', ...)` →
   `performExpandFromRootUnit`), which reads the needed `.pas` files from
   disk in the **main** process (not the renderer) and runs
   `expandDependencyGraph`.
4. The renderer (`renderer/components/graphView.js`) draws `{ nodes, edges }`
   with `vis-network`'s `Network` — no page reload involved; the same
   renderer session reacts to each IPC push.
5. `Edição > Selecionar Unit`'s `click` handler (`main/menu.js`) just sends
   `mainWindow.webContents.send('app:show-root-unit-selection')`, with no
   payload — the main process holds no Project state. The renderer
   (`src/renderer/index.js`) keeps the last `{ projectUnits, projectDir }`
   received via `onProjectLoaded` in a module-level variable, and opens the
   Command Palette's `Selecionar Unit` mode with it
   (`enterRootUnitMode(projectUnits, projectDir, { entry: 'direct', closable:
   hasRenderedGraphForCurrentProject })`) on `onShowRootUnitSelection`; if no
   Project has been opened yet in the session, the click is a no-op.
   `app:project-loaded` also opens this same mode automatically (`entry:
   'direct', closable: false`), before the user has picked any Root Unit for
   that Project. `Edição > Selecionar Método` just shows a
   `dialog.showMessageBox` placeholder alert — no IPC, no renderer state
   change.
6. `Ferramentas > Paleta de Comandos` (shortcut `CmdOrCtrl+P`) sends
   `app:show-command-palette`, and the renderer opens the Command Palette in
   its Command list mode. The list is `availableCommands(COMMANDS, {
   hasProject })` (so `Selecionar Unit` only shows up once a Project has been
   loaded in the session) filtered by `filterCommands`, with the shortcut
   hint on each row. Choosing a Command closes the palette and calls
   `runCommand(id)` over `commands:run` (the same `runCommand` the menu
   uses), except `Abrir recente` and `Selecionar Unit`, which switch the
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
