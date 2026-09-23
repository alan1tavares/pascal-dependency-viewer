# Design

## Context

`src/renderer/components/graphView.js` is the sole consumer of
`vis-network`/`vis-data`. It exports one function,
`renderGraph(nodesData, edgesData, rootUnitId)`, called by
`src/renderer/index.js` after `expandFromRootUnit` resolves. Today it:
delegates rendering, physics, drag and zoom/pan entirely to
`vis-network`'s `Network`; keeps node/edge state in a `vis-data`
`DataSet`, whose reactive `update()` calls drive the View Filter
show/hide without touching physics; and turns physics off once via
`network.once('stabilizationIterationsDone', ...)`.

`d3-force` provides none of that by itself — it is only a force
simulation engine. See `proposal.md` (Why / What Changes) for the
motivation; this document covers how the replacement is built.

## Goals / Non-Goals

**Goals:**
- Replace the rendering/interaction stack (render, drag, zoom/pan,
  view-filter reactivity) while satisfying the three affected specs'
  requirements, including the two intentionally changed behaviors
  (physics reheats on View Filter toggle; drag is elastic, not
  sticky).
- Keep `renderGraph`'s public signature and call site unchanged, so
  `src/renderer/index.js` and everything upstream of it (IPC, domain
  layer, menu, Command Palette) needs no changes.
- Add automated test coverage for the non-visual logic in this file,
  which has none today.

**Non-Goals:**
- Visual redesign (new colors, shapes, or edge styles) — this change
  is engine parity only.
- Any change to `src/main/**`, `src/preload/**`, `src/domain/**`, or
  other renderer components (`rootUnitSelection.js`, `commandPalette.js`).
- Optimizing for graphs far larger than a typical Delphi project's
  unit count (low hundreds of nodes at most). Canvas-based rendering
  is not pursued here; revisit only if real usage shows it's needed.

## Decisions

**SVG over Canvas.**
SVG elements are individually addressable in the DOM, so `d3-drag`'s
per-node hit-testing and `jsdom`-based tests both work without extra
plumbing; styling reuses CSS the same way `index.html` already does
for the View Filter panel. Canvas would scale further past thousands
of nodes, but that's outside this project's actual graph sizes, and it
would require hand-rolled hit-testing for drag and would not be
inspectable by `jsdom` tests.

**Individual D3 submodules, not the `d3` meta-package.**
Only `d3-force`, `d3-selection`, `d3-drag`, and `d3-zoom` are added to
`package.json` (plus whatever they pull transitively, e.g. `d3-array`,
`d3-dispatch`). The full `d3` package bundles dozens of unused
modules (scales, shapes, geo, etc.); installing only what's used keeps
the dependency list legible and avoids the exact kind of unexamined
bulk this migration is moving away from.

**Force configuration mapping.**
| vis-network (today) | d3-force (this change) |
| --- | --- |
| `forceAtlas2Based` solver | `forceManyBody` (node repulsion) + `forceLink` (edge attraction, distance ≈ current `springLength: 100`) |
| `avoidOverlap: 1` | `forceCollide(nodeRadius)`, radius per node so differently-sized nodes (label length) don't overlap |
| `centralGravity: 0.05` | a weak `forceCenter` (or `forceX`/`forceY` toward the container's center) pulling the whole graph toward the middle of the viewport |
| `stabilization: { iterations: 200 }` + `once('stabilizationIterationsDone', ...)` turning physics off | default `alphaDecay`, with the simulation's `"end"` event (fired once `alpha` drops below `alphaMin`) used to stop re-rendering ticks — same "converge once, then go idle" shape |

**Physics reheat on View Filter change.**
Toggling any View Filter checkbox calls `simulation.alpha(0.3).restart()`
(a partial reheat, not a full `alpha(1)` reset, so already-converged
graphs resettle quickly rather than re-simulating from scratch) and
relies on the same `"end"` listener to idle it again automatically.
This is decoupled from the show/hide mechanics below — a filter change
does two independent things: recompute visibility (CSS only), and
reheat the simulation (physics only).

**View Filter visibility stays CSS-only, never removes simulation nodes.**
The visibility rules (`isOriginVisible`/`isEdgeVisible`, unchanged
logic from today's `setUpViewFilter`) toggle an SVG `display`/`opacity`
attribute on the corresponding `<g>`/`<line>` element. Nodes and edges
are never removed from the simulation's `nodes`/`links` arrays or from
the DOM when hidden — only their visual visibility changes. This keeps
the force layout's node/link topology stable across filter toggles
(a hidden node still occupies its slot in the simulation, so
reappearing nodes don't "pop in" at a stale position) while the
reheat above still lets the *visible* subset settle into new
positions.

**Elastic drag, uniformly.**
Standard `d3-drag` pattern on each node's `<g>`:
- `dragstarted`: set `d.fx = d.x; d.fy = d.y`, bump `simulation.alphaTarget(0.3).restart()` so the simulation stays warm while dragging.
- `dragged`: update `d.fx`/`d.fy` to the pointer position each tick.
- `dragended`: reset `simulation.alphaTarget(0)`, then set `d.fx = d.fy = null`, releasing the node back to the simulation immediately.

This applies the same way regardless of whether a View-Filter-triggered
reheat is in flight — there is no separate "pinned" state to reconcile
between the two, which is what keeps this decision simple.

**Zoom/pan vs. node drag event ownership.**
`d3-zoom` is attached to the outer `<svg>` (pan/zoom the whole
viewport); `d3-drag` is attached to each node's `<g>`. D3's default
event capture means a `mousedown` on a node's drag handler fires
before it can bubble to the svg's zoom handler, so dragging a node
does not simultaneously pan the canvas — no extra coordination code
needed beyond attaching each behavior to its own selection.

**Test environment: per-file `jsdom`, not a global Jest config change.**
The new test file(s) for `graphView.js` (or the extracted non-visual
helpers) start with `/** @jest-environment jsdom */`, rather than
changing `jest.config.js`'s global `testEnvironment`. This leaves
`src/domain/**`'s existing suite (which needs no DOM) on its current
`node` environment, untouched by this change, and keeps the jsdom
dependency scoped to exactly the tests that need it.

## Risks / Trade-offs

- **[Risk]** Rebuilding rendering, drag, zoom, and view-filter
  reactivity from scratch is a large regression surface across three
  specs at once. → **Mitigation**: automated tests for all non-visual
  logic (visibility calculation, node/edge assembly, fx/fy transitions
  across drag and reheat) plus a manual pass through every scenario in
  `dependency-graph-layout`, `graph-canvas-layout`, and
  `graph-view-filter` before merging.
- **[Risk]** Reheating physics on every filter toggle could feel slow
  or jarring on graphs with many visible nodes. → **Mitigation**: use
  a partial reheat (`alpha(0.3)`, not `alpha(1)`) so convergence is
  fast for a graph that's already mostly settled; tune further after
  manual testing if it feels wrong.
- **[Risk]** Elastic drag means no arrangement a user makes is ever
  permanent — any subsequent filter toggle re-simulates visible nodes,
  including ones just dragged. → **Mitigation**: this is the
  intentional, explicitly requested trade-off (see proposal's What
  Changes), not a defect; noting it here so it isn't "fixed" later
  without revisiting the proposal.
- **[Risk]** SVG with many nodes/edges could be slower than
  `vis-network`'s canvas rendering at large graph sizes. →
  **Mitigation**: out of scope per Non-Goals; the domain's graphs are
  small enough in practice that this is not expected to matter, and a
  Canvas rewrite remains possible later if it does.

## Migration Plan

Single change, no feature flag, no dual-library period (per proposal:
`graphView.js` is the only consumer). Steps:
1. Add `d3-force`, `d3-selection`, `d3-drag`, `d3-zoom` to
   `package.json`; remove `vis-network` and `vis-data`.
2. Rewrite `graphView.js` behind its existing `renderGraph` export, so
   `src/renderer/index.js` needs no changes.
3. Add the non-visual test file(s) with `/** @jest-environment jsdom */`.
4. Manually verify each scenario in the three modified specs (window
   resize/fullscreen, no-overlap with high fan-out and direct cycles,
   drag-then-release, filter toggles including the reheat and the
   Root-Unit-stays-visible case).
5. Merge as a single PR. Rollback is a plain revert — no persisted
   state (only the Recent Projects JSON, untouched by this change)
   depends on the graph rendering library.
