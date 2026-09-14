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

- `src/main/index.js`: creates the `BrowserWindow`, registers the three IPC
  handlers from `main/ipc/`, and builds the menu via `main/menu.js`.
- `src/main/ipc/{file,project,graph}.js`: one module per IPC domain —
  `file.js` (`performOpenFile`/`openFile`), `project.js`
  (`performOpenProject`/`openProject`), `graph.js`
  (`performExpandFromRootUnit`/`expandFromRootUnit`). `file.js` and
  `project.js` also export their `performOpenX` function so `menu.js` can
  reuse the same logic for the native `File` menu.
- `src/main/services/fileSystem.js`: thin wrapper around
  `fs.readFileSync(filePath, 'utf-8')`, used by all three `ipc/` modules.
- `src/main/menu.js`: `buildMenu(mainWindow, { performOpenFile, performOpenProject })`
  — builds the `File > Open` / `File > Open Project` / `viewMenu` template.
- `src/preload/index.js` + `src/preload/api.js`: `preload/api.js` is the
  plain object exposed on `window.pascalDependencyViewer`;
  `preload/index.js` is just the `contextBridge.exposeInMainWorld` call.
- `src/renderer/index.js` + `src/renderer/components/{graphView,rootUnitSelection}.js`:
  `index.js` is the entrypoint (wires the IPC listeners below);
  `graphView.js` renders the `vis-network` graph, `rootUnitSelection.js`
  renders the Root Unit search/listing screen.

**Process boundaries**: `contextIsolation: true` / `nodeIntegration: false` on
the `BrowserWindow` (`src/main/index.js`). The renderer never `require()`s
anything directly — `src/preload/api.js` exposes a narrow API on
`window.pascalDependencyViewer`: `openFile()`, `openProject()`,
`expandFromRootUnit(args)` (all `ipcRenderer.invoke`), plus
`onGraphLoaded(cb)`/`onProjectLoaded(cb)` listeners.

**Data flow**:

1. File > Open / File > Open Project are native `Menu` items (`main/menu.js`);
   their `click` handler runs the dialog + parsing directly in the main
   process (`performOpenFile`/`performOpenProject`, in `main/ipc/file.js` /
   `main/ipc/project.js`), then pushes the result to the renderer via
   `mainWindow.webContents.send('app:graph-loaded' | 'app:project-loaded', ...)`.
2. `performOpenFile`: `getUnitName`/`selectUsesFromSource` (from
   `domain/parsePascalSource/`) parse the `.pas` source,
   `mountDependenceGraphStructure` builds `{ nodes, edges }`.
3. `performOpenProject`: `parseDprSource` builds the list of Project Units
   from the `.dpr`.
4. Clicking a Root Unit in the renderer calls `expandFromRootUnit` over IPC
   (`main/ipc/graph.js`'s `ipcMain.handle('expandFromRootUnit', ...)` →
   `performExpandFromRootUnit`), which reads the needed `.pas` files from
   disk in the **main** process (not the renderer) and runs
   `expandDependencyGraph`.
5. The renderer (`renderer/components/graphView.js`) draws `{ nodes, edges }`
   with `vis-network`'s `Network` — no page reload involved; the same
   renderer session reacts to each IPC push.

**Cross-process communication is IPC** (`ipcMain.handle`/`ipcRenderer.invoke`
for renderer-initiated calls, `webContents.send` for main-initiated pushes
from the menu) — there is no `electron-store`/shared-blob step and no
`reloadMainWindow()`; navigating between the Root Unit selection screen and
the graph screen is just DOM manipulation inside one page load.

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
