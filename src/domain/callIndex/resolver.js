// Segunda passada da resolução (design D2–D4): percorre o corpo de cada
// Method/bloco com uma pilha de escopos, resolve o tipo de cada designador e
// avisa o `sink` de cada chamada (direta ou polimórfica) e de cada Method
// referenciado sem ser chamado (Entry Point). Receptor não resolvido não gera
// nada (ADR 0006).
//
// `sink`: { call(calleeId, { kind, viaId?, viaLabel? }), entry(methodId) };
// o Caller corrente é definido por quem chama `resolveUnit` (`sink.caller`).

import {
  finalizationId,
  initializationId,
  methodId,
  methodLabel,
  programId,
} from '../methods/index.js';

const lower = (s) => s.toLowerCase();
const NONE = { kind: 'none' };
const VIRTUAL_DIRECTIVES = ['virtual', 'dynamic', 'override', 'abstract'];
const EVENT_NAME = /^On[A-Z0-9_]/;

export class Resolver {
  constructor(table, sink) {
    this.table = table;
    this.sink = sink;
    this.withs = [];
  }

  // ------------------------------------------------------------ entrada
  resolveUnit(unit) {
    const ast = unit.ast;
    if (unit.isProgram) {
      const caller = programId(ast.name);
      this.sink.caller = caller;
      const scope = this.unitScope(unit);
      for (const decl of ast.decls) {
        if (decl.k === 'routine' && decl.body) this.walkRoutine(decl, unit, scope);
      }
      this.walkStatements(ast.body, scope);
      return;
    }
    for (const decl of ast.impl.decls) {
      if (decl.k !== 'routine' || !decl.body) continue;
      this.sink.caller = methodId(unit.name, decl.className, decl.name);
      this.walkRoutine(decl, unit, null);
    }
    if (ast.init) {
      this.sink.caller = initializationId(unit.name);
      this.walkStatements(ast.init, this.unitScope(unit));
    }
    if (ast.final) {
      this.sink.caller = finalizationId(unit.name);
      this.walkStatements(ast.final, this.unitScope(unit));
    }
  }

  unitScope(unit) {
    return {
      parent: null,
      vars: new Map(),
      info: { unit, ent: null, selfVal: null, typeParams: [], localTypes: new Map(), routine: null },
    };
  }

  // ------------------------------------------------------------ escopos
  walkRoutine(decl, unit, parentScope) {
    const parentInfo = parentScope && parentScope.info;
    let ent = parentInfo ? parentInfo.ent : null;
    if (!parentInfo || !parentInfo.routine) {
      ent = decl.className ? this.table.entityForClassName(unit, decl.className) : null;
    }
    const nested = Boolean(parentInfo && parentInfo.routine);
    const info = {
      unit,
      ent,
      selfVal: ent ? { t: 'obj', ent, bind: new Map() } : null,
      typeParams: [...(parentInfo ? parentInfo.typeParams : []), ...(decl.typeParams || [])],
      localTypes: new Map(parentInfo ? parentInfo.localTypes : []),
      // `inherited` dentro de rotina aninhada refere-se ao Method envolvente.
      routine: nested ? parentInfo.routine : decl,
    };
    const scope = { parent: nested ? parentScope : null, vars: new Map(), info };
    const typeCtx = this.typeCtx(scope);
    for (const group of decl.params) {
      for (const name of group.names) scope.vars.set(lower(name), { kind: 'value', typeAst: group.type, ctx: typeCtx });
    }
    if (decl.returnType) scope.vars.set('result', { kind: 'value', typeAst: decl.returnType, ctx: typeCtx });
    this.declareLocals(decl.decls, scope);
    for (const local of decl.decls) {
      if (local.k === 'routine' && local.body) this.walkRoutine(local, unit, scope);
    }
    if (decl.body) this.walkStatements(decl.body, scope);
  }

  declareLocals(decls, scope) {
    const ctx = this.typeCtx(scope);
    for (const local of decls) {
      if (local.k === 'var') {
        for (const name of local.names) scope.vars.set(lower(name), { kind: 'value', typeAst: local.type, ctx });
      } else if (local.k === 'const') {
        scope.vars.set(lower(local.name), { kind: 'value', typeAst: local.type, ctx });
      } else if (local.k === 'type') {
        scope.info.localTypes.set(lower(local.name), { kind: 'type', name: local.name, decl: local, unit: scope.info.unit, outer: null });
      } else if (local.k === 'routine') {
        scope.vars.set(lower(local.name), { kind: 'local', decl: local, ctx });
      }
    }
  }

  typeCtx(scope) {
    const info = scope.info;
    return { unit: info.unit, ent: info.ent, bind: null, locals: info.localTypes, typeParams: info.typeParams };
  }

  childScope(scope) {
    return { parent: scope, vars: new Map(), info: scope.info };
  }

  // ------------------------------------------------------------ instruções
  walkStatements(stmts, scope) {
    for (const stmt of stmts) this.walkStatement(stmt, scope);
  }

  walkStatement(stmt, scope) {
    if (!stmt) return;
    switch (stmt.k) {
      case 'assign': {
        const targetType = this.evalTarget(stmt.target, scope);
        const isReference = (targetType && targetType.t === 'proc') || (!targetType && isEventTarget(stmt.target));
        this.evalExpr(stmt.value, scope, { mode: isReference ? 'ref' : 'value', needsValue: true });
        break;
      }
      case 'expr':
        this.evalExpr(stmt.expr, scope, { mode: 'value' });
        break;
      case 'block':
        this.walkStatements(stmt.stmts, scope);
        break;
      case 'if':
        this.evalExpr(stmt.cond, scope, { needsValue: true });
        this.walkStatement(stmt.then, scope);
        this.walkStatement(stmt.else, scope);
        break;
      case 'case':
        this.evalExpr(stmt.expr, scope, { needsValue: true });
        for (const branch of stmt.branches) {
          for (const label of branch.labels) this.evalExpr(label, scope, { needsValue: true });
          this.walkStatement(branch.stmt, scope);
        }
        if (stmt.else) this.walkStatements(stmt.else, scope);
        break;
      case 'for': {
        const fromType = this.evalExpr(stmt.from, scope, { needsValue: true });
        this.evalExpr(stmt.to, scope, { needsValue: true });
        if (stmt.declaresVar) this.declareInline(scope, stmt.variable, stmt.varType, fromType);
        this.walkStatement(stmt.body, scope);
        break;
      }
      case 'forin': {
        const collection = this.evalExpr(stmt.collection, scope, { needsValue: true });
        const elem = this.table.enumeratedType(collection);
        if (stmt.declaresVar) this.declareInline(scope, stmt.variable, stmt.varType, elem);
        const bodyScope = this.childScope(scope);
        // O tipo do elemento vale mesmo quando a variável foi declarada antes
        // com um tipo mais genérico (ou genérico livre).
        if (!stmt.declaresVar && elem) bodyScope.vars.set(lower(stmt.variable), { kind: 'value', type: elem });
        this.walkStatement(stmt.body, bodyScope);
        break;
      }
      case 'while':
        this.evalExpr(stmt.cond, scope, { needsValue: true });
        this.walkStatement(stmt.body, scope);
        break;
      case 'repeat':
        this.walkStatements(stmt.body, scope);
        this.evalExpr(stmt.cond, scope, { needsValue: true });
        break;
      case 'with': {
        const pushed = stmt.exprs.map((expr) => this.evalExpr(expr, scope, { needsValue: true }));
        this.withs.push(...pushed);
        this.walkStatement(stmt.body, scope);
        this.withs.length -= pushed.length;
        break;
      }
      case 'try':
        this.walkStatements(stmt.body, scope);
        for (const handler of stmt.handlers) {
          const handlerScope = this.childScope(scope);
          if (handler.name) {
            handlerScope.vars.set(lower(handler.name), { kind: 'value', typeAst: handler.type, ctx: this.typeCtx(scope) });
          }
          this.walkStatement(handler.stmt, handlerScope);
        }
        if (stmt.exceptBody) this.walkStatements(stmt.exceptBody, scope);
        if (stmt.finallyBody) this.walkStatements(stmt.finallyBody, scope);
        break;
      case 'raise':
        if (stmt.expr) this.evalExpr(stmt.expr, scope, { needsValue: true });
        break;
      case 'localvar': {
        const valueType = stmt.value ? this.evalExpr(stmt.value, scope, { needsValue: true }) : null;
        for (const name of stmt.names) this.declareInline(scope, name, stmt.type, valueType);
        break;
      }
      default:
        break;
    }
  }

  declareInline(scope, name, typeAst, inferred) {
    const type = typeAst ? this.table.resolveType(typeAst, this.typeCtx(scope)) : inferred;
    scope.vars.set(lower(name), { kind: 'value', type });
  }

  // ------------------------------------------------------------ expressões
  evalExpr(node, scope, { mode = 'value', needsValue = false } = {}) {
    if (!node) return null;
    return this.finish(this.evalRef(node, scope), { mode, needsValue });
  }

  // Avalia um designador sem "consumir" o último passo: um Method ainda não
  // foi chamado nem referenciado (`finish` decide), uma property ainda não
  // foi lida e um nome de tipo continua sendo um tipo.
  evalRef(node, scope) {
    switch (node.k) {
      case 'name':
        return this.lookup(node.name, scope);
      case 'member':
        return this.evalMember(node, scope);
      case 'call':
        return this.evalCall(node, scope);
      case 'index':
        return this.evalIndex(node, scope);
      case 'deref': {
        const type = this.evalExpr(node.obj, scope, { needsValue: true });
        return value(type && type.t === 'ptr' ? type.to : null);
      }
      case 'generic':
        return this.evalGeneric(node, scope);
      case 'paren':
        return value(this.evalExpr(node.expr, scope, { needsValue: true }));
      case 'as': {
        this.evalExpr(node.expr, scope, { needsValue: true });
        return value(instanceOf(this.evalRef(node.type, scope)));
      }
      case 'inherited':
        return this.evalInherited(node, scope);
      case 'addr':
        this.finish(this.evalRef(node.expr, scope), { mode: 'ref' });
        return value(null);
      case 'anon':
        this.walkRoutine(node.routine, scope.info.unit, scope.info.routine ? scope : { ...scope, info: { ...scope.info, routine: node.routine } });
        return value({ t: 'proc', spec: node.routine, ctx: this.typeCtx(scope) });
      case 'binop':
        this.evalExpr(node.left, scope, { needsValue: true });
        if (node.op === 'is') this.evalRef(node.right, scope);
        else this.evalExpr(node.right, scope, { needsValue: true });
        return value(null);
      case 'unop':
        this.evalExpr(node.expr, scope, { needsValue: true });
        return value(null);
      case 'set':
        for (const item of node.items) this.evalExpr(item, scope, { needsValue: true });
        return value(null);
      default:
        return value(null);
    }
  }

  finish(ref, { mode = 'value', needsValue = false } = {}) {
    switch (ref.kind) {
      case 'value':
        return ref.type;
      case 'callable':
        // Uma procedure não tem valor: usada onde se espera um valor, só pode
        // estar sendo passada adiante.
        if (mode === 'ref' || (needsValue && isProcedure(ref))) {
          this.markEntry(ref);
          return { t: 'proc', spec: null, ctx: null };
        }
        this.invoke(ref);
        return this.returnType(ref);
      case 'property':
        return this.readProperty(ref);
      case 'type':
        return ref.type && ref.type.ent ? { t: 'meta', ent: ref.type.ent, bind: ref.type.bind } : null;
      default:
        return null;
    }
  }

  lookup(name, scope) {
    const key = lower(name);
    const info = scope.info;
    if (key === 'self' && info.selfVal) return value(info.selfVal);
    for (let i = this.withs.length - 1; i >= 0; i--) {
      const recv = this.withs[i];
      if (!recv || (recv.t !== 'obj' && recv.t !== 'meta')) continue;
      const found = this.table.findMember(recv, name);
      if (found) return this.memberRef(found, recv);
    }
    for (let s = scope; s; s = s.parent) {
      const entry = s.vars.get(key);
      if (!entry) continue;
      if (entry.kind === 'local') return { kind: 'callable', target: 'local', decl: entry.decl, ctx: entry.ctx };
      if (entry.type === undefined) entry.type = this.table.resolveType(entry.typeAst, entry.ctx);
      return value(entry.type);
    }
    if (info.selfVal) {
      const found = this.table.findMember(info.selfVal, name);
      if (found) return this.memberRef(found, info.selfVal);
    }
    if (info.localTypes.has(key)) {
      return { kind: 'type', type: this.table.typeValFromSym(info.localTypes.get(key), [], this.typeCtx(scope)) };
    }
    const syms = this.table.lookupGlobal(name, info.unit);
    if (syms) return this.globalRef(syms, [], this.typeCtx(scope));
    const unit = this.table.unitPrefix(name);
    if (unit) return { kind: 'unit', ...unit };
    return NONE;
  }

  globalRef(syms, typeArgs, ctx) {
    const sym = syms.find((s) => s.kind === 'type' && s.ent) || syms[0];
    switch (sym.kind) {
      case 'type':
        return { kind: 'type', type: this.table.typeValFromSym(sym, typeArgs, ctx) };
      case 'var':
      case 'const':
        return value(this.table.resolveType(sym.type, { unit: sym.unit }));
      case 'routine':
        return { kind: 'callable', target: 'routine', sym };
      default:
        return NONE;
    }
  }

  memberRef(found, recv, { isStatic = false } = {}) {
    const { member, owner } = found;
    switch (member.kind) {
      case 'field':
      case 'const':
        return value(this.table.memberType(member, owner, member.type));
      case 'method':
        return { kind: 'callable', target: 'member', found, recv, isStatic };
      case 'property':
        return { kind: 'property', found, recv };
      default:
        return NONE;
    }
  }

  evalMember(node, scope) {
    const base = this.evalRef(node.obj, scope);
    if (base.kind === 'unit') {
      if (base.unit) {
        const own = base.unit === scope.info.unit;
        const syms = (own ? base.unit.all : base.unit.intf).get(lower(node.name));
        if (syms) return this.globalRef(syms, [], this.typeCtx(scope));
        const deeper = this.table.unitPrefix(`${base.unit.name}.${node.name}`);
        return deeper ? { kind: 'unit', ...deeper } : NONE;
      }
      const deeper = this.table.unitPrefix(`${base.prefix}.${node.name}`);
      return deeper ? { kind: 'unit', ...deeper } : NONE;
    }
    if (base.kind === 'type') {
      const type = base.type;
      if (!type || !type.ent) return NONE;
      const nested = this.table.findNested(type.ent, lower(node.name));
      if (nested) return { kind: 'type', type: this.table.typeValFromSym(nested, [], this.typeCtx(scope)) };
      const meta = { t: 'meta', ent: type.ent, bind: type.bind };
      const found = this.table.findMember(meta, node.name);
      return found ? this.memberRef(found, meta) : NONE;
    }
    let recv = this.finish(base, { mode: 'value' });
    if (recv && recv.t === 'ptr') recv = recv.to;
    if (!recv || (recv.t !== 'obj' && recv.t !== 'meta')) return NONE;
    const found = this.table.findMember(recv, node.name);
    return found ? this.memberRef(found, recv) : NONE;
  }

  evalCall(node, scope) {
    const callee = this.evalRef(node.callee, scope);
    if (callee.kind === 'type') {
      // Cast: `TCliente(Obj)`
      for (const arg of node.args) this.evalExpr(arg, scope, { needsValue: true });
      return value(instanceOf(callee));
    }
    if (callee.kind === 'callable') {
      const params = this.paramTypes(callee, node.args.length);
      node.args.forEach((arg, i) => {
        const paramType = params[i];
        this.evalExpr(arg, scope, { mode: paramType && paramType.t === 'proc' ? 'ref' : 'value', needsValue: true });
      });
      this.invoke(callee);
      return value(this.returnType(callee));
    }
    const calleeType = this.finish(callee, { mode: 'value' });
    for (const arg of node.args) this.evalExpr(arg, scope, { needsValue: true });
    if (calleeType && calleeType.t === 'proc' && calleeType.spec && calleeType.spec.returnType) {
      return value(this.table.resolveType(calleeType.spec.returnType, calleeType.ctx));
    }
    return value(null);
  }

  evalIndex(node, scope) {
    const base = this.evalRef(node.obj, scope);
    if (base.kind === 'property' && base.found.member.prop.params.length) {
      for (const arg of node.args) this.evalExpr(arg, scope, { needsValue: true });
      return value(this.readProperty(base));
    }
    let type = this.finish(base, { mode: 'value' });
    for (const arg of node.args) this.evalExpr(arg, scope, { needsValue: true });
    if (type && type.t === 'ptr') type = type.to;
    if (!type) return value(null);
    if (type.t === 'array') return value(type.elem);
    if (type.t === 'obj') {
      for (let current = { ent: type.ent }; current; current = this.table.ancestorOf(current.ent)) {
        if (!current.ent.defaultProp) continue;
        const found = this.table.findMember(type, current.ent.defaultProp.name);
        if (found) return value(this.readProperty({ kind: 'property', found, recv: type }));
      }
    }
    return value(null);
  }

  evalGeneric(node, scope) {
    if (node.base.k === 'name') {
      const syms = this.table.lookupGlobal(node.base.name, scope.info.unit);
      const arity = node.typeArgs.length;
      const sym = syms && syms.find((s) => s.kind === 'type' && (s.decl.typeParams || []).length === arity);
      if (sym) return { kind: 'type', type: this.table.typeValFromSym(sym, node.typeArgs, this.typeCtx(scope)) };
    }
    return this.evalRef(node.base, scope);
  }

  evalInherited(node, scope) {
    const info = scope.info;
    if (!info.selfVal) return NONE;
    const name = node.name || (info.routine && info.routine.name);
    if (!name) return NONE;
    const found = this.table.findMember(info.selfVal, name, { startAtAncestor: true });
    if (!found) return NONE;
    return this.memberRef(found, info.selfVal, { isStatic: true });
  }

  // Lado esquerdo de `:=`: o último passo não é chamado nem lido (é escrito).
  evalTarget(node, scope) {
    if (node.k !== 'name' && node.k !== 'member') return this.evalExpr(node, scope, { needsValue: true });
    const ref = this.evalRef(node, scope);
    if (ref.kind === 'property') return this.writeProperty(ref);
    if (ref.kind === 'value') return ref.type;
    return null;
  }

  // ------------------------------------------------------------ chamadas
  invoke(ref) {
    if (ref.target === 'routine') {
      if (ref.sym.hasBody) this.sink.call(ref.sym.id, { kind: 'direct' });
    } else if (ref.target === 'member') {
      this.recordMemberCall(ref.found.member, ref.recv, ref.isStatic);
    }
  }

  recordMemberCall(member, recv, isStatic) {
    const table = this.table;
    if (table.hasBody(member)) this.sink.call(member.id, { kind: 'direct' });
    if (isStatic) return;
    const owner = member.owner;
    const via = { kind: 'polymorphic', viaId: member.id, viaLabel: methodLabel(owner.qualifiedName, member.name) };
    const key = lower(member.name);
    if (owner.kind === 'interface') {
      for (const ent of table.entities) {
        if (ent.unit.isStub || ent.kind === 'interface') continue;
        const implemented = [...table.allInterfaces(ent)].some((intf) => table.isInterfaceDescendant(intf, owner));
        if (!implemented) continue;
        const found = table.findMember({ ent, bind: null }, member.name);
        if (found && found.member.kind === 'method' && found.member.owner.kind !== 'interface' && table.hasBody(found.member)) {
          this.sink.call(found.member.id, via);
        }
      }
      return;
    }
    if (!VIRTUAL_DIRECTIVES.some((d) => member.directives.has(d))) return;
    const staticClass = recv && recv.ent ? recv.ent : owner;
    for (const descendant of table.descendants(staticClass)) {
      const own = (descendant.members.get(key) || []).find((m) => m.kind === 'method');
      if (!own || !own.directives.has('override') || !table.hasBody(own)) continue;
      if (this.overrides(descendant, member)) this.sink.call(own.id, via);
    }
  }

  // O `override` declarado em `ent` pertence à cadeia virtual de `base`?
  overrides(ent, base) {
    const key = lower(base.name);
    for (let current = this.table.ancestorOf(ent); current; current = this.table.ancestorOf(current.ent)) {
      const decl = (current.ent.members.get(key) || []).find((m) => m.kind === 'method');
      if (!decl) continue;
      if (decl === base) return true;
      if (!decl.directives.has('override')) return false;
    }
    return false;
  }

  markEntry(ref) {
    if (ref.target === 'routine' && ref.sym.hasBody) this.sink.entry(ref.sym.id);
    else if (ref.target === 'member' && this.table.hasBody(ref.found.member)) this.sink.entry(ref.found.member.id);
  }

  readProperty(ref) {
    const { found, recv } = ref;
    const prop = found.member.prop;
    if (prop.read) this.callAccessor(prop.read, recv);
    return this.table.memberType(found.member, found.owner, prop.type);
  }

  writeProperty(ref) {
    const { found, recv } = ref;
    const prop = found.member.prop;
    if (prop.write) this.callAccessor(prop.write, recv);
    return this.table.memberType(found.member, found.owner, prop.type);
  }

  // Ler/escrever uma property com acessor de método executa esse método.
  callAccessor(path, recv) {
    if (path.length !== 1) return;
    const found = this.table.findMember(recv, path[0]);
    if (found && found.member.kind === 'method') this.recordMemberCall(found.member, recv, false);
  }

  // ------------------------------------------------------------ assinaturas
  headings(ref) {
    if (ref.target === 'member') return ref.found.members.filter((m) => m.kind === 'method').map((m) => ({ routine: m.routine, member: m }));
    if (ref.target === 'routine') return ref.sym.headings.map((routine) => ({ routine }));
    return [{ routine: ref.decl }];
  }

  pickHeading(ref, argCount) {
    const headings = this.headings(ref);
    const count = (h) => h.routine.params.reduce((n, g) => n + g.names.length, 0);
    return headings.find((h) => count(h) === argCount) || headings.find((h) => count(h) > argCount) || headings[0];
  }

  resolveIn(ref, typeAst, heading) {
    if (ref.target === 'member') {
      const owner = heading.member ? { ent: heading.member.owner, bind: ownerBind(ref, heading.member) } : ref.found.owner;
      return this.table.memberType(heading.member, owner, typeAst);
    }
    if (ref.target === 'routine') return this.table.resolveType(typeAst, { unit: ref.sym.unit });
    return this.table.resolveType(typeAst, ref.ctx);
  }

  paramTypes(ref, argCount) {
    const heading = this.pickHeading(ref, argCount);
    const types = [];
    for (const group of heading.routine.params) {
      const type = group.type ? this.resolveIn(ref, group.type, heading) : null;
      for (let i = 0; i < group.names.length; i++) types.push(type);
    }
    return types;
  }

  returnType(ref) {
    const heading = this.headings(ref)[0];
    if (heading.routine.kind === 'constructor' && ref.recv && ref.recv.ent) {
      return { t: 'obj', ent: ref.recv.ent, bind: ref.recv.bind };
    }
    if (!heading.routine.returnType) return null;
    return this.resolveIn(ref, heading.routine.returnType, heading);
  }
}

function ownerBind(ref, member) {
  return member.owner === ref.found.owner.ent ? ref.found.owner.bind : null;
}

function value(type) {
  return { kind: 'value', type };
}

function instanceOf(ref) {
  if (ref.kind !== 'type' || !ref.type) return null;
  return ref.type.ent ? { t: 'obj', ent: ref.type.ent, bind: ref.type.bind } : ref.type;
}

function isProcedure(ref) {
  if (ref.target === 'member') return ref.found.member.routine.kind === 'procedure';
  if (ref.target === 'routine') return ref.sym.headings[0].kind === 'procedure';
  return ref.decl.kind === 'procedure';
}

function isEventTarget(node) {
  return (node.k === 'member' || node.k === 'name') && EVENT_NAME.test(node.name);
}

