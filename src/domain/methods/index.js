// Methods de uma Unit e o formato dos ids (design D1, `CONTEXT.md` — Method).

export function methodId(unitName, className, name) {
  return `unit:${unitName}|${className ?? ''}|${name}`.toLowerCase();
}

export function methodLabel(className, name) {
  return className ? `${className}.${name}` : name;
}

export const programId = (projectName) => `program:${projectName}`.toLowerCase();
export const initializationId = (unitName) => `init:${unitName}`.toLowerCase();
export const finalizationId = (unitName) => `final:${unitName}`.toLowerCase();

export const PROGRAM_LABEL = 'Programa';
export const initializationLabel = (unitName) => `${unitName} (initialization)`;
export const finalizationLabel = (unitName) => `${unitName} (finalization)`;

/**
 * Methods de uma Unit já analisada: toda routine com corpo na
 * `implementation`, de classe/record ou solta, na ordem do primeiro corpo.
 * Overloads viram um só Method; rotinas aninhadas e anonymous methods não
 * são Methods próprios (ficam em `decls`/no corpo da routine que os envolve).
 */
export function listUnitMethods(ast) {
  const methods = [];
  const seen = new Set();
  for (const decl of ast.impl.decls) {
    if (decl.k !== 'routine' || !decl.body) continue;
    const id = methodId(ast.name, decl.className, decl.name);
    if (seen.has(id)) continue;
    seen.add(id);
    methods.push({
      id,
      label: methodLabel(decl.className, decl.name),
      className: decl.className,
      name: decl.name,
    });
  }
  return methods;
}
