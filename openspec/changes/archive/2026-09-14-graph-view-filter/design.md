## Context

See `proposal.md` - Why. Current shapes, for reference:

- `selectUsesFromSource(source, scope = 'interface')` → `string[]` (flat,
  deduped names), `scope` ∈ `{ interface, interfaceAndImplementation }`
  (`src/domain/parsePascalSource/selectUsesFromSource.js`).
- `expandDependencyGraph(rootUnitName, projectUnits, readFile, scope)` →
  `{ nodes: {id,label,group}[], edges: {from,to}[] }`
  (`src/domain/expandDependencyGraph/index.js`). Root Unit is always
  inserted into the internal `nodes` Map first, before the BFS loop, so
  it is always `nodes[0]` in the returned array — an implicit fact the
  renderer has never needed until now.
- `rootUnitSelection.js` reads the checked radio (`input[name="usesScope"]`)
  at click time and passes `scope` through `expandFromRootUnit` IPC into
  `performExpandFromRootUnit` (`src/main/ipc/graph.js`), which forwards it
  unchanged into `expandDependencyGraph`.
- `graphView.js` calls `renderGraph(nodes, edges)`, builds two
  `vis-data` `DataSet`s from the arrays as given (no per-item `id`,
  vis-data auto-assigns one), and never touches them again after the
  initial `new Network(...)`.
- `index.html` has one inline `<style>` block and no per-file CSS; this
  change keeps that convention rather than introducing a stylesheet.

## Goals / Non-Goals

**Goals:**
- Move the interface/implementation choice from a pre-generation radio to
  a live, per-edge filter on the already-rendered graph.
- Keep the domain layer (`src/domain/**`) free of any Electron/vis-network
  dependency, per the existing architecture.

**Non-Goals:**
- Persisting the View Filter across graph generations or app restarts
  (explicitly not persisted, per `CONTEXT.md`).
- Changing how nodes are styled by `group` (`projectUnit`/`externalUnit`)
  — orthogonal to Uses Clause Origin.
- Changing `graph-canvas-layout` behavior (the panel is a fixed-position
  overlay, independent of how `#mynetwork` fills the window).

## Decisions

**`selectUsesFromSource(source)` returns `{ unitName, origin }[]`, no `scope` param.**
Internally it still splits into `interfaceSection`/`implementationSection`
and extracts each with the existing regex machinery (unchanged) — only
the merge step changes: instead of `mergeUnitLists` silently dropping
duplicates, it tags each unique unit (case-insensitive) with
`origin: 'interface' | 'implementation' | 'both'`, preserving
interface-then-implementation first-appearance order. `USES_CLAUSE_SCOPE`
is replaced by a `USES_CLAUSE_ORIGIN` enum (`INTERFACE`,
`IMPLEMENTATION`, `BOTH`).
Alternative considered: keep returning a flat `string[]` and expose
origin via a second parallel array. Rejected — pairing name and origin in
one object avoids index-alignment bugs at every call site.

**`expandDependencyGraph` drops `scope`, always walks both sections, tags each edge with its origin, and returns `rootUnitId` explicitly.**
Per `dependency-graph-expansion`'s spec, the BFS now calls
`selectUsesFromSource(source)` (no scope), gets back
`{unitName, origin}[]`, runs `classifyExternalUnits` on the names exactly
as today, then zips the classification back with `origin` (arrays stay
index-aligned since `classifyExternalUnits` preserves input order) to
push `{ from, to, origin }` edges. Because `selectUsesFromSource` already
dedupes a single unit across both sections into one `origin: 'both'`
entry, the existing one-edge-per-BFS-visit loop naturally produces one
edge per `(from, to)` pair — no extra edge-merging step needed.
The return shape becomes `{ nodes, edges, rootUnitId }`, adding
`rootUnitId` explicitly instead of leaving "root is `nodes[0]`" as an
implicit contract.
Alternative considered: let the renderer rely on array order
(`nodes[0]`). Rejected — it already happens to be true today but nothing
enforces it, and the "Root Unit always visible" rule is core enough to
this change to deserve an explicit, testable field rather than an
accidental one.

**Edge `id` for `vis-data` is synthesized in the renderer, not in the domain layer.**
`graphView.js` maps each `{from, to, origin}` edge to
`{ id: `${from}::${to}`, from, to }` (uniqueness guaranteed by the
one-edge-per-pair rule above) before constructing the `DataSet`, so the
View Filter can toggle a specific edge's `hidden` flag by id later.
`origin` is kept in a plain side lookup (`Map` keyed by the same id)
rather than as a `vis-data` field, since `vis-network` doesn't need it
for rendering — it's the filter's own bookkeeping.
Alternative considered: put `id`/origin-tagging in the domain layer.
Rejected — `id` composition for `vis-data` is a rendering concern; the
domain layer's edge shape (`{from,to,origin}`) stays exactly what the
`dependency-graph-expansion` spec describes, independent of any
rendering library.

**Filtering toggles `hidden` on existing `DataSet` items instead of removing/re-adding them.**
On a checkbox change, `graphView.js` recomputes which edge ids should be
visible (origin intersects the checked set) and which node ids should be
visible (Root Unit, plus any node touched by a visible edge), then calls
`edges.update(...)`/`nodes.update(...)` setting `hidden: true/false` per
item. This keeps existing node positions stable across toggles (no
physics re-stabilization) and needs no new IPC round-trip, satisfying
"reflected dynamically" from the proposal.
Alternative considered: rebuild the `DataSet`s from scratch on every
toggle. Rejected — cheap for small graphs, but throws away layout/physics
state for no benefit over `hidden`, which `vis-network` supports natively
for both nodes and edges.

**Checkbox listeners are assigned via `.onchange`, not `addEventListener`.**
`renderGraph` (and therefore the View Filter panel setup) can run more
than once per app session — each new Root Unit selection re-renders the
graph. Assigning `checkbox.onchange = handler` (which replaces any
previous handler) instead of `addEventListener` avoids accumulating
duplicate listeners across re-renders, which would otherwise double-apply
the filter and corrupt the "at least one checked" guard.

**IPC drops `scope` from `expandFromRootUnit`'s args; no versioning needed.**
Since this is an internal `ipcRenderer.invoke`/`ipcMain.handle` contract
with a single first-party caller (the renderer, updated in the same
change), there's no external consumer to keep compatible — the parameter
is simply removed from both sides.

## Risks / Trade-offs

- [Renderer forgets to re-derive visible nodes when only edges are
  toggled, leaving a node visible with zero visible edges] → Recompute
  the full visible-node-id set from the visible-edge set on every toggle
  (plus the Root Unit), rather than trying to incrementally patch it.
- [Assuming `(from, to)` is a unique key for edge ids breaks if a future
  change allows multiple distinct edges between the same pair] → Today's
  spec guarantees at most one edge per `(from, to)` pair (one BFS visit
  per unit, one deduped entry per dependency); revisit the id scheme if
  that invariant ever changes.

## Migration Plan

No persisted data or external API to migrate — the View Filter is
never stored, and `expandFromRootUnit` has one first-party caller updated
in the same change. Rollback is a plain revert of this change's commits.
Existing tests for `selectUsesFromSource` and `expandDependencyGraph`
need updating for the new signatures/shapes (tracked in `tasks.md`).

## Open Questions

- Exact visual styling of the floating panel (colors, spacing, font) is
  left to implementation taste — it doesn't affect any spec'd behavior.
