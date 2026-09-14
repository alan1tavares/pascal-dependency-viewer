# Pascal Dependency Viewer

Visualizes how Pascal/Delphi units depend on each other, starting from a
Root Unit picked out of a whole Delphi project.

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
Project Units, recursively, always following both `interface` and
`implementation` `uses` (see Uses Clause Origin) regardless of how the
result is later displayed. Each unit is expanded at most once — a unit
reached again from elsewhere in the walk gets an edge back to its existing
node rather than a duplicated subtree, so the result is a DAG, not a literal
tree (diamond dependencies merge; cycles close instead of recursing forever).
_Avoid_: "Dependency Tree" — imprecise, since nodes can have multiple parents.

**Uses Clause Origin**:
Which section of a Unit's source — `interface` or `implementation` — declared
a given `uses` reference. Recorded on each edge of the Dependency Graph as
the walk parses every Unit; an edge declared in both sections carries both
origins. This is a property of the graph data, independent of what the
graph screen currently displays.

**View Filter**:
Which Uses Clause Origins (`interface`, `implementation`, or both) are
currently shown on the graph screen. Chosen on the graph screen itself,
toggled independently per origin, and not persisted — changing it re-renders
the already-computed Dependency Graph without re-walking the filesystem. At
least one origin is always selected; defaults to both.
_Avoid_: "Uses Clause Scope" — the old single setting that conflated
generation-time walking with display-time filtering; replaced by the two
terms above now that they vary independently.
