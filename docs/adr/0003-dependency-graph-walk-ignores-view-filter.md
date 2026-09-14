# Dependency Graph walk always follows both Uses Clause Origins

The graph screen's View Filter (interface / implementation / both, see
`CONTEXT.md`) can be toggled at any time and must re-render the graph
instantly, without a new `expandFromRootUnit` round-trip. To make that
possible, `expandDependencyGraph` always walks the union of `interface` and
`implementation` `uses` for every visited Unit — never just the subset the
View Filter currently shows — and tags each edge with its Uses Clause
Origin(s). The View Filter only hides/shows already-computed nodes and
edges client-side; it never changes what gets read from disk.

This replaces the previous behavior, where choosing "Interface" in the old
Uses Clause Scope radio limited which files were even read during the walk.
The trade-off is deliberate: every graph expansion now reads potentially
more `.pas` files than a interface-only walk would, in exchange for the
View Filter never needing to hit the filesystem again after the initial
load. Typical Delphi project sizes make the extra I/O negligible next to
the UX cost of a filter that has to wait on disk.
