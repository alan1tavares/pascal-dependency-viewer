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
- `npx jest src/test/parsePascalSource.test.js` — run a single test file
- `npx jest -t "get the unit name"` — run a single test by name
- `npm run package` — build a production bundle without creating installers
- `npm run make` — build platform installers (not configured/exercised beyond the Forge defaults)

## Architecture

Electron Forge + Vite scaffold (`create-electron-app@latest --template=vite`),
with three processes: `src/main.js` (main), `src/preload.js` (preload), and
`src/renderer.js` + `index.html` (renderer). The app is split into that
Electron process layer and a pure parsing/model layer (`src/model`). The model
layer has no Electron dependency, which is why it's the part covered by tests.

**Process boundaries**: `contextIsolation: true` / `nodeIntegration: false` on
the `BrowserWindow` (`src/main.js`). The renderer never `require()`s anything
directly — `src/preload.js` exposes a narrow API on `window.pascalDependencyViewer`
via `contextBridge`: `openFile()`, `openProject()`, `expandFromRootUnit(args)`
(all `ipcRenderer.invoke`), plus `onGraphLoaded(cb)`/`onProjectLoaded(cb)`
listeners.

**Data flow** (all wired in `src/main.js`):

1. File > Open / File > Open Project are native `Menu` items; their `click`
   handler runs the dialog + parsing directly in the main process
   (`performOpenFile`/`performOpenProject`), then pushes the result to the
   renderer via `mainWindow.webContents.send('app:graph-loaded' | 'app:project-loaded', ...)`.
2. `performOpenFile`: `getUnitName`/`selectUsesFromSource` parse the `.pas`
   source, `mountDependenceGraphStructure` builds `{ nodes, edges }`.
3. `performOpenProject`: `parseDprSource` builds the list of Project Units
   from the `.dpr`.
4. Clicking a Root Unit in the renderer calls `expandFromRootUnit` over IPC
   (`ipcMain.handle('expandFromRootUnit', ...)` → `performExpandFromRootUnit`),
   which reads the needed `.pas` files from disk in the **main** process (not
   the renderer) and runs `expandDependencyGraph`.
5. The renderer draws `{ nodes, edges }` with `vis-network`'s `Network` — no
   page reload involved; the same renderer session reacts to each IPC push.

**Cross-process communication is IPC** (`ipcMain.handle`/`ipcRenderer.invoke`
for renderer-initiated calls, `webContents.send` for main-initiated pushes
from the menu) — there is no `electron-store`/shared-blob step and no
`reloadMainWindow()`; navigating between the Root Unit selection screen and
the graph screen is just DOM manipulation inside one page load.

**Graph shape convention** (`mountDependenceGraphStructure/index.js`,
`expandDependencyGraph/index.js`): node `id` is always lowercased (so edges
match regardless of case) while `label` keeps the original casing. Edges
always point from the main unit `to` each dependency. When expanding from a
Root Unit, nodes get a `group` (`projectUnit` or `externalUnit`) used by the
renderer's `vis-network` options to style them differently.

## Notes

- Parsing is regex-based and currently reads only the first `uses` clause it
  finds (`selectUsesFromSource`). There is no handling for a missing `unit`/`uses`
  clause — `.match(...)[0]` will throw on no match.
- `src/model/**` and `src/test/**` are untouched by the Electron Forge/Vite
  migration — no Electron dependency, no path changes, same Jest suite.
- The `src/model/**` files are CommonJS (`module.exports`). Vite's default
  `commonjsOptions` in the Rollup config only applies CJS interop to
  `node_modules`; `vite.main.config.mjs` explicitly extends
  `build.commonjsOptions.include` to also cover `src/model/**`, otherwise the
  main-process bundle fails to resolve those imports.
- `mainWindow.webContents.openDevTools()` is conditioned on `!app.isPackaged`
  (was unconditional before the migration).
