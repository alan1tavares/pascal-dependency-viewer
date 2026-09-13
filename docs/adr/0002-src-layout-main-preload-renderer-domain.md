# Restructure `src/` into `main/preload/renderer/domain`, staying plain JavaScript and framework-free

The app's process layer (`src/main.js`, `src/preload.js`, `src/renderer.js`)
had grown into three flat files each doing several unrelated things (window
creation, menu, IPC registration, and glue logic all inline in `main.js`).
We restructured `src/` into `main/` (with `ipc/` split by domain — `file`,
`project`, `graph` — plus `services/` and `menu.js`), `preload/` (`index.js`
+ `api.js`), and `renderer/` (`index.js` + `components/`), while renaming
`model/` to `domain/` — same pure, Electron-free, folder-per-module content,
just relocated as a sibling of `main/preload/renderer` instead of implicitly
living next to them.

This is a pure reorganization: no new capability was added, and no requirement
in any capability spec changed.

## Considered options

- **TypeScript** (`main/index.ts`, `shared/types.ts`, etc.) — rejected. The
  project has no TS tooling today (no `tsconfig.json`, no `@types/*`), and
  introducing it is disproportionate to a structural-only change with no
  behavior change to type-check.
- **A UI framework for the renderer** (React `App.tsx`/`components/`/`pages/`/
  `hooks/`/`store/`, or an equivalent Vue tree) — rejected. The renderer is
  two DOM screens (Root Unit selection, graph view) toggled by show/hide, with
  state as local closures; there's no external state or routing need today.
  We kept only `renderer/components/` (one file per screen) and dropped
  `pages/`, `hooks/`, `store/` rather than create them empty.
- **`shared/` for cross-process types/constants** — rejected. Its only
  purpose in the proposed layout was sharing TypeScript types, which doesn't
  apply without TS; the IPC channel name duplication between `preload/api.js`
  and `main/ipc/*.js` that a `shared/` module could have deduplicated already
  existed before this change, so fixing it wasn't part of this reorg's scope.
- **Folding `domain/` into `main/services/`** — rejected. The pre-existing
  architecture (documented in `CLAUDE.md`) deliberately keeps this layer free
  of any Electron dependency, which is why it's the part covered by Jest
  tests. Moving it under `main/` would erase that isolation for no benefit.

## Consequences

- `src/package.json` (`{ "type": "module" }`, added when `domain/` — then
  `model/` — first moved to native ESM) stays. Removing it would make `npm
  test` depend on an undocumented Jest 30 fallback that only exists on
  Node ≥ 24.9 (`vm.SourceTextModule.prototype.hasAsyncGraph`); the project
  declares no `engines` constraint, so keeping the file is what makes the
  test suite deterministic across Node versions.
- `main/services/` and `main/ipc/` only contain what the app already does
  today (`fs` reads, the three existing IPC channels). `services/db`,
  `services/updater`, `services/nativeModules` are not created — nothing
  exists yet for them to hold.
