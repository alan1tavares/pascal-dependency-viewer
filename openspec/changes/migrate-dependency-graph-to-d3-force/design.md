# Design

## Context

`src/renderer/components/graphView.js` is the sole consumer of
`vis-network`/`vis-data`. It exports one function,
`renderGraph(nodesData, edgesData, rootUnitId)`, called by
`src/renderer/index.js` after `expandFromRootUnit` resolves. Today it
delegates rendering, physics, drag and zoom/pan entirely to
`vis-network`'s `Network`, keeps node/edge state in a `vis-data`
`DataSet` (whose reactive `update()` drives the View Filter show/hide
without touching physics), and turns physics off once via
`network.once('stabilizationIterationsDone', ...)`.

Per the proposal, `vis-network` is not being replaced: a second,
permanent rendering path built on `d3-force` is added, and the user
picks between them at runtime via a new Command Palette entry. `d3-force`
provides only the physics engine — rendering, drag, zoom/pan, and
view-filter reactivity for that path are built from `d3-selection`,
`d3-drag`, and `d3-zoom`. See `proposal.md` (Why / What Changes) for
the motivation; this document covers how both paths coexist.

## Goals / Non-Goals

**Goals:**
- Add a `d3-force`-based rendering path that satisfies the three
  graph-behavior specs' requirements, including the two intentionally
  different behaviors versus `vis-network` (physics reheats on View
  Filter toggle; drag is elastic, not sticky) — scoped to that path
  only.
- Let the user switch between `vis-network` and `d3-force` at runtime
  from the Command Palette, re-rendering the currently displayed graph
  immediately with the other engine.
- Keep `vis-network`'s existing behavior and code path completely
  unchanged.
- Keep `renderGraph`'s conceptual call site unchanged from the rest of
  the app's point of view: `src/renderer/index.js` still has one place
  it asks for the graph to be (re-)rendered, regardless of which engine
  answers.

**Non-Goals:**
- Visual redesign (new colors, shapes, or edge styles) for either
  engine — the `d3-force` path matches `vis-network`'s current
  appearance.
- Automated test coverage for either rendering path. Validation is
  manual, against the specs' scenarios, for both engines.
- Any change to `src/main/**` beyond routing the new Command, or to
  `src/preload/**`, `src/domain/**` (besides the Command catalog), or
  other renderer components (`rootUnitSelection.js`,
  `commandPalette.js`'s own rendering).
- Optimizing for graphs far larger than a typical Delphi project's
  unit count (low hundreds of nodes at most).
- Persisting the selected renderer across app restarts (explicitly
  session-only, per `graph-renderer-selection`).

## Decisions

**Module layout: two sibling renderers behind a thin dispatcher.**
`src/renderer/components/graphView.js` keeps its current `vis-network`
implementation completely as-is. A new sibling module,
`src/renderer/components/graphViewD3Force.js`, holds the `d3-force`
implementation with the same exported shape
(`renderGraph(nodesData, edgesData, rootUnitId)`). A small dispatcher
— either a third module (`src/renderer/graphRenderer.js`) or a few
lines in `src/renderer/index.js` — holds the currently-selected engine
and calls the matching module's `renderGraph`. This keeps the two
implementations fully independent (no shared helpers forced between
them just because they happen to live in the same file), which matters
because they are expected to diverge in behavior permanently, not
converge later.

**Selection state: in-memory in the renderer, not in main.**
The selected engine (`'vis-network' | 'd3-force'`) is a module-level
variable in the renderer process, defaulting to `'vis-network'` on
load — mirroring how `src/renderer/index.js` already keeps the last
`{ projectUnits, projectDir }` in memory rather than asking main for
it. The main process holds no renderer-selection state, consistent
with it holding no Project state today.

**Toggle command: main process only routes, renderer does the work.**
`Alternar renderização do grafo` is added to `COMMANDS` in
`src/domain/commands/` (`requiresProject: false`, no shortcut, after
`Selecionar Unit`). `runCommand` in `src/main/commands.js` handles its
id the same shallow way it handles `selectUnit` — it has no
dialog/file-system work, so it just
`webContents.send('app:toggle-graph-renderer')`. The renderer's
listener (in `src/renderer/index.js`) flips the selection variable
and, if a graph is currently on screen, re-renders it using the last
retained `{ nodesData, edgesData, rootUnitId }` (see next decision) —
it does not re-invoke `expandFromRootUnit` or re-read any file.

**Retaining the last rendered graph's inputs.**
`src/renderer/index.js` already retains `{ projectUnits, projectDir }`
across screens; it needs to additionally retain the exact
`{ nodesData, edgesData, rootUnitId }` passed to `renderGraph` the last
time a graph was shown, purely so the toggle can replay the same
render call through the other engine without touching the domain
layer or IPC.

**`d3-force` rendering: SVG, individual D3 submodules, force mapping,
elastic drag, filter-triggered reheat.**
Unchanged from the original single-engine design (carried over
verbatim, now scoped to the `d3-force` path specifically):
- SVG over Canvas: individually addressable DOM nodes, simpler CSS
  styling and hit-testing for `d3-drag`.
- `d3-force`, `d3-selection`, `d3-drag`, `d3-zoom` as individual
  packages, not the `d3` meta-package.
- Force mapping: `forceManyBody` + `forceLink` (distance ≈ current
  `springLength: 100`) replace `forceAtlas2Based`; `forceCollide(nodeRadius)`
  replaces `avoidOverlap`; a weak `forceCenter`/`forceX`/`forceY`
  replaces `centralGravity: 0.05`; the simulation's `"end"` event
  (alpha below `alphaMin`) replaces `stabilizationIterationsDone` for
  turning physics off.
- View Filter toggle calls `simulation.alpha(0.3).restart()` (partial
  reheat) — decoupled from visibility, which stays CSS-only
  (`display`/`opacity` on the corresponding SVG element), never
  removing nodes/edges from the simulation's arrays or the DOM.
- Drag is the canonical elastic `d3-drag` pattern: `dragstarted` pins
  `fx`/`fy` and bumps `alphaTarget(0.3)`; `dragged` updates `fx`/`fy`;
  `dragended` resets `alphaTarget(0)` and clears `fx`/`fy` to `null`,
  uniformly, whether or not a filter-triggered reheat is in flight.
- `d3-zoom` on the outer `<svg>`, `d3-drag` on each node's `<g>` — D3's
  event capture means a node drag doesn't also pan the background.

## Risks / Trade-offs

- **[Risk]** Keeping two rendering engines permanently doubles the
  maintenance surface forever: any future change to
  `dependency-graph-layout`, `graph-canvas-layout`, or
  `graph-view-filter` needs an explicit decision about whether it
  applies to one engine or both. → **Mitigation**: this is an accepted,
  intentional trade-off of making the comparison permanent rather than
  a temporary rollout; not something this change can mitigate away.
  Future spec changes to these three capabilities should state which
  engine(s) they target.
- **[Risk]** These three specs describe only the `d3-force` path's
  target behavior; the `vis-network` path's behavior (sticky drag, no
  filter-triggered reheat) is not described by any currently active
  spec text, even though it remains fully reachable by the user via
  the toggle. → **Mitigation**: this is a deliberate simplification,
  not an oversight (see proposal's Capabilities section) — the
  `vis-network` path's behavior is simply "whatever it already did
  before this change," which does not need a spec to remain true.
  Noting it here so a future reader doesn't assume the omission is a
  bug.
- **[Risk]** Divergent visual/interaction behavior between two engines
  could confuse users switching between them mid-session (e.g. a node
  dragged in `vis-network` stays put; the same drag in `d3-force`
  doesn't). → **Mitigation**: this is the explicit point of the
  comparison; not treated as a defect.
- **[Risk]** Reheating physics on every filter toggle (d3-force path)
  could feel slow or jarring on graphs with many visible nodes. →
  **Mitigation**: partial reheat (`alpha(0.3)`, not `alpha(1)`) so
  convergence is fast for an already-settled graph; tune further after
  manual testing.
- **[Risk]** No automated tests for either rendering path means a
  regression in either engine (including the previously-untouched
  `vis-network` path, if it's accidentally touched during the
  dispatcher refactor) is only caught by manual verification. →
  **Mitigation**: the manual QA pass (see Migration Plan) explicitly
  includes re-verifying `vis-network`'s existing behavior, not just
  the new `d3-force` path, specifically because the dispatcher
  refactor touches the file that currently contains it.

## Migration Plan

No feature flag beyond the Command Palette toggle itself, no removal
of `vis-network`/`vis-data`, no rollback plan needed in the usual sense
— both engines ship together and the default (`vis-network`) preserves
today's exact behavior for anyone who never invokes the new Command.
Steps:
1. Add `d3-force`, `d3-selection`, `d3-drag`, `d3-zoom` to
   `package.json`, alongside the existing `vis-network`/`vis-data`.
2. Extract the current `graphView.js` content behind the dispatcher
   described above, verifying its behavior is unchanged (this is a
   pure refactor for the `vis-network` path).
3. Add `graphViewD3Force.js` with the new rendering path.
4. Add the `Alternar renderização do grafo` Command end-to-end (domain
   catalog → `runCommand` → IPC → renderer listener → dispatcher
   toggle + re-render).
5. Manually verify every scenario in the four modified/added specs
   (`dependency-graph-layout`, `graph-canvas-layout`,
   `graph-view-filter`, `command-palette`, `graph-renderer-selection`),
   for both engines where applicable — including that `vis-network`'s
   behavior is unchanged after the dispatcher refactor.
6. Merge as a single PR.
