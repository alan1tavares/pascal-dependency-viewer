// Montagem do índice de chamadas de um Project (design D5/D6).
//
// `buildCallIndex({ dprPath, projectUnits, readFile })` lê o `.dpr`, cada
// Project Unit (na ordem do `.dpr`) e seus formulários texto, nunca External
// Units. `readFile(caminho)` é assíncrono e recebe `dprPath` ou o caminho de
// uma Project Unit/formulário como aparece no `.dpr` (relativo à pasta dele).
// O event loop é cedido entre uma Unit e outra.
//
// Resultado:
// {
//   projectName,
//   units: [{ unitName, methods: [{ id, label, className, name }], skipped? }],
//   nodes: Map<id, { id, label, unitName, kind }>,   // Methods e blocos
//   callers: Map<id, [{ callerId, kind: 'direct'|'polymorphic', viaId?, viaLabel? }]>,
//   entryPoints: Set<id>,
//   skippedUnits: [{ unitName, reason }],
// }

import { parseSource } from '../pascalParser/parser.js';
import {
  finalizationId,
  finalizationLabel,
  initializationId,
  initializationLabel,
  listUnitMethods,
  programId,
  PROGRAM_LABEL,
} from '../methods/index.js';
import { RTL_STUBS } from './rtlStubs.js';
import { buildSymbolTable } from './symbols.js';
import { Resolver } from './resolver.js';
import { formPaths, parseForm } from './dfm.js';

const yieldToEventLoop = () => new Promise((resolve) => setTimeout(resolve, 0));

let stubAsts = null;
function rtlStubAsts() {
  if (!stubAsts) stubAsts = RTL_STUBS.map((stub) => parseSource(stub.source));
  return stubAsts;
}

const reasonOf = (error) => (error && error.message) || String(error);

export async function buildCallIndex({ dprPath, projectUnits, readFile }) {
  const skippedUnits = [];
  const units = [];
  const nodes = new Map();
  const callers = new Map();
  const entryPoints = new Set();

  // ---- leitura e parsing
  const fallbackName = dprPath.replace(/^.*[/\\]/, '').replace(/\.[^.]*$/, '');
  let programAst = null;
  try {
    programAst = parseSource(await readFile(dprPath));
    if (programAst.k !== 'program') throw new Error('O arquivo não é um program');
  } catch (error) {
    programAst = null;
    skippedUnits.push({ unitName: fallbackName, reason: reasonOf(error) });
  }
  const projectName = programAst ? programAst.name : fallbackName;

  const parsed = [];
  for (const projectUnit of projectUnits) {
    try {
      const ast = parseSource(await readFile(projectUnit.path));
      if (ast.k !== 'unit') throw new Error('O arquivo não é uma unit');
      const methods = listUnitMethods(ast);
      units.push({ unitName: projectUnit.unitName, methods });
      parsed.push({ projectUnit, ast });
      for (const method of methods) {
        nodes.set(method.id, { id: method.id, label: method.label, unitName: ast.name, kind: 'method' });
      }
      if (ast.init) {
        nodes.set(initializationId(ast.name), { id: initializationId(ast.name), label: initializationLabel(ast.name), unitName: ast.name, kind: 'initialization' });
        entryPoints.add(initializationId(ast.name));
      }
      if (ast.final) {
        nodes.set(finalizationId(ast.name), { id: finalizationId(ast.name), label: finalizationLabel(ast.name), unitName: ast.name, kind: 'finalization' });
        entryPoints.add(finalizationId(ast.name));
      }
    } catch (error) {
      const reason = reasonOf(error);
      units.push({ unitName: projectUnit.unitName, methods: [], skipped: reason });
      skippedUnits.push({ unitName: projectUnit.unitName, reason });
    }
    await yieldToEventLoop();
  }
  if (programAst) {
    const id = programId(projectName);
    nodes.set(id, { id, label: PROGRAM_LABEL, unitName: projectName, kind: 'program' });
    entryPoints.add(id);
  }

  // ---- primeira passada: declarações
  const table = buildSymbolTable([
    ...rtlStubAsts().map((ast) => ({ ast, isStub: true })),
    ...parsed.map(({ ast }) => ({ ast })),
    ...(programAst ? [{ ast: programAst, isProgram: true }] : []),
  ]);

  // ---- segunda passada: corpos
  const seen = new Map(); // calleeId → Set de chaves já registradas
  const sink = {
    caller: null,
    call(calleeId, ref) {
      if (!nodes.has(calleeId)) return;
      const key = `${this.caller}|${ref.kind}|${ref.viaId || ''}`;
      if (!seen.has(calleeId)) seen.set(calleeId, new Set());
      if (seen.get(calleeId).has(key)) return;
      seen.get(calleeId).add(key);
      if (!callers.has(calleeId)) callers.set(calleeId, []);
      callers.get(calleeId).push({ callerId: this.caller, ...ref });
    },
    entry(id) {
      if (nodes.has(id)) entryPoints.add(id);
    },
  };
  const resolver = new Resolver(table, sink);
  const formHandlers = new Map(); // classe do formulário → nomes dos handlers

  for (const { projectUnit, ast } of parsed) {
    const unit = table.unitByName(ast.name);
    resolver.resolveUnit(unit);
    await readFormHandlers({ table, unit, projectUnit, readFile, formHandlers });
    forgetBodies(ast);
    await yieldToEventLoop();
  }
  if (programAst) resolver.resolveUnit(table.unitByName(programAst.name));
  markFormHandlers(table, formHandlers, sink);

  return { projectName, units, nodes, callers, entryPoints, skippedUnits };
}

// Lê o formulário texto de cada Unit (`{$R *.dfm}`) e guarda os candidatos
// a handler por classe de formulário. Formulário binário, ausente ou
// ilegível é ignorado sem afetar a Unit.
async function readFormHandlers({ table, unit, projectUnit, readFile, formHandlers }) {
  for (const path of formPaths(projectUnit.path, unit.ast.resources || [])) {
    let form;
    try {
      form = parseForm(await readFile(path));
    } catch {
      continue;
    }
    if (form.binary || !form.handlers.length) continue;
    const ent = (form.rootClass && table.entityForClassName(unit, form.rootClass)) || firstClass(table, unit);
    if (!ent) continue;
    if (!formHandlers.has(ent)) formHandlers.set(ent, []);
    formHandlers.get(ent).push(...form.handlers.map((h) => h.handler));
  }
}

// Handlers ligados no formulário são Entry Points: cada nome é resolvido
// como Method da classe do formulário. Como no Delphi, os handlers do
// formulário ancestral valem para os formulários herdados, resolvidos pelo
// nome na classe descendente (que pode redeclarar o Method).
function markFormHandlers(table, formHandlers, sink) {
  for (const ent of table.entities) {
    if (ent.unit.isStub || ent.kind !== 'class') continue;
    const self = { t: 'obj', ent, bind: new Map() };
    for (let current = { ent }; current; current = table.ancestorOf(current.ent)) {
      for (const handler of formHandlers.get(current.ent) || []) {
        const found = table.findMember(self, handler);
        if (found && found.member.kind === 'method' && table.hasBody(found.member)) sink.entry(found.member.id);
      }
    }
  }
}

function firstClass(table, unit) {
  return table.entities.find((ent) => ent.unit === unit && ent.kind === 'class') || null;
}

// Os corpos não são mais necessários depois da segunda passada (o índice
// guarda só ids e referências).
function forgetBodies(ast) {
  for (const decl of ast.impl.decls) {
    if (decl.k === 'routine') {
      decl.body = null;
      decl.decls = [];
    }
  }
  ast.init = ast.init ? [] : null;
  ast.final = ast.final ? [] : null;
}

