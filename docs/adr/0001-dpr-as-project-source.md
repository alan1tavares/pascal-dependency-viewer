# Use the `.dpr` file, not `.dproj`, as the Project source

To add a "load a Delphi project" feature, we needed a single artifact to
derive the list of the project's own units from. We chose the `.dpr` file:
its `uses` clause already lists each unit paired with its file path
(`UnitA in 'UnitA.pas'`), giving a direct unit → file mapping via the same
lightweight regex parsing this codebase already uses for single `.pas`
files. We considered `.dproj` (the XML project file IDEs surface as "the
project"), but it would require XML parsing and doesn't map as directly to
source files; we also considered scanning the project folder for `.pas`
files, but that can't distinguish project units from unrelated files sitting
in the same folder. `.groupproj` (multi-project groups) is out of scope
entirely — only a single `.dpr` is supported as a Project.
