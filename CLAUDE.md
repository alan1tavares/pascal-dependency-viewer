# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Electron desktop app that visualizes the dependency graph of Pascal units. The
user opens a `.pas` file, the app parses its `unit` name and `uses` clause, then
renders a directed graph (via the `vis-network`/`vis-data` libraries) with an
edge from the unit to each dependency.

## Commands

- `yarn start` — launch the Electron app (`electron .`)
- `yarn test` — run the Jest test suite
- `npx jest src/test/parsePascalSource.test.js` — run a single test file
- `npx jest -t "get the unit name"` — run a single test by name

## Architecture

The app is split into an Electron process layer (`src/components`) and a pure
parsing/model layer (`src/model`). The model layer has no Electron dependencies,
which is why it's the part covered by tests.

**Data flow** (all wired in `src/components/Main/Menu/index.js`, the File > Open handler):

1. `handleOpenDialogSelectFile()` — native dialog, returns the selected `.pas` path
2. `getUnitName(source)` + `selectUsesFromSource(source)` — regex-parse the unit name and `uses` list
3. `mountDependenceGraphStructure(unitName, listUses)` — builds `{ nodes, edges }` in `vis-data` DataSet shape
4. The graph object is written to `electron-store`, then `reloadMainWindow()` fires
5. `index.html` reads `nodes`/`edges` back out of `electron-store` and renders them with `vis-network`'s `Network`

**Cross-process communication uses `electron-store` as a shared blob**, not
IPC. The main process writes the graph; the renderer (`index.html`) reads it on
load. `mainWindowId` is also stashed in the store so `reloadMainWindow()` can
find the window's `webContents` by id. The store is cleared on window close.

**Graph shape convention** (`mountDependenceGraphStructure/index.js`): node `id`
is always lowercased (so edges match regardless of case) while `label` keeps the
original casing. Edges always point from the main unit `to` each dependency.

## Notes

- Parsing is regex-based and currently reads only the first `uses` clause it
  finds (`selectUsesFromSource`). There is no handling for a missing `unit`/`uses`
  clause — `.match(...)[0]` will throw on no match.
- `nodeIntegration: true` (with `contextIsolation: false`, required since
  Electron 12 defaults `contextIsolation` to `true`) is enabled so `index.html`
  can `require('vis-network')`, `require('vis-data')`, and
  `require('electron-store')` directly in the renderer.
- `electron-store` is pinned to `^8.2.0` on purpose: v9+ is ESM-only and would
  break the `require('electron-store')` calls in this CommonJS codebase.
