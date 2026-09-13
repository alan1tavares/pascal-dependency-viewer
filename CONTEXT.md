# Pascal Dependency Viewer

Visualizes how Pascal/Delphi units depend on each other, either from a single
opened `.pas` file or from a whole Delphi project.

## Language

**Unit**:
A single Pascal source file (`.pas`), declared by its `unit Name;` header. The
basic node of every dependency graph the app draws.

**Project**:
A Delphi `.dpr` file. Its `uses` clause enumerates the project's own units,
each paired with its file path (`UnitA in 'UnitA.pas'`), giving a direct
Unit → file mapping.
_Avoid_: `.dproj`, `.groupproj` — not supported as the "project" artifact.

**Project Unit**:
A `uses` entry inside a Project's `.dpr` that has an explicit `in 'path'`.
These are the project's own units — the only ones searchable/selectable as a
Root Unit, since they're the only ones with a file to open.
_Avoid_: conflating with entries lacking `in 'path'` (RTL/VCL units, not part
of the project).

**Root Unit**:
The Project Unit the user picks from the search/listing screen to start a
Dependency Graph from.

**External Unit**:
A unit referenced by some `uses` clause during graph expansion that is not a
Project Unit (no matching `.dpr` entry with `in 'path'`) — e.g. RTL/VCL or a
third-party library. Rendered as a leaf node, styled distinctly from Project
Units to signal the graph couldn't expand further there.

**Dependency Graph**:
The transitive expansion of a Root Unit's `uses` references into further
Project Units, recursively. Each unit is expanded at most once — a unit
reached again from elsewhere in the walk gets an edge back to its existing
node rather than a duplicated subtree, so the result is a DAG, not a literal
tree (diamond dependencies merge; cycles close instead of recursing forever).
_Avoid_: "Dependency Tree" — imprecise, since nodes can have multiple parents.
Contrast with the single-file flow (`File > Open`), which only ever shows one
level (a unit and its direct `uses`), independent of any Project.

**Uses Clause Scope**:
Whether a Dependency Graph walk follows only the `interface` section's
`uses`, or both `interface` and `implementation`. Chosen per generation on
the search/listing screen (not a persisted global setting); defaults to
`interface` only.
