// Primeira passada da resolução (design D2): tabela de símbolos global com
// tipos, ancestrais, interfaces, membros, routines soltas, variáveis e
// constantes de cada Unit, respeitando `interface` (visível por quem usa a
// Unit) e `implementation` (visível só na própria Unit). Também resolve
// referências a tipos para valores de tipo (`TypeVal`):
//
//   { t: 'obj',   ent, bind }   instância de class/record/interface
//   { t: 'meta',  ent, bind }   referência de classe (`TFoo`, `class of`)
//   { t: 'proc',  spec, ctx }   tipo procedural/evento
//   { t: 'array', elem }        array (indexar devolve `elem`)
//   { t: 'ptr',   to }          ponteiro
//   null                        tipo desconhecido (External Unit sem stub,
//                               tipos simples, strings...)

import { methodId } from '../methods/index.js';

const lower = (s) => s.toLowerCase();

export class SymbolTable {
  constructor() {
    this.units = new Map(); // nome em minúsculas → UnitSym
    this.entities = []; // todas as TypeEnt de classe/record/interface
    this.entityByDecl = new Map();
    this.helpers = new Map(); // TypeEnt → [TypeEnt helper]
    this.children = null; // TypeEnt → [TypeEnt descendente direto]
  }

  // ------------------------------------------------------------ montagem
  addUnit(ast, { isStub = false, isProgram = false } = {}) {
    const unit = {
      name: ast.name,
      ast,
      isStub,
      isProgram,
      intf: new Map(), // símbolos visíveis por quem usa a Unit
      all: new Map(), // todos os símbolos da Unit
      usesIntf: [],
      usesImpl: [],
      bodies: new Set(), // ids de Methods com corpo
    };
    this.units.set(lower(ast.name), unit);
    if (isProgram) {
      unit.usesImpl = ast.uses.map((u) => u.name);
      this.addDecls(unit, ast.decls, false);
    } else {
      unit.usesIntf = ast.intf.uses.map((u) => u.name);
      unit.usesImpl = ast.impl.uses.map((u) => u.name);
      this.addDecls(unit, ast.intf.decls, true);
      this.addDecls(unit, ast.impl.decls, false);
    }
    return unit;
  }

  addDecls(unit, decls, visible) {
    const add = (name, sym) => {
      const key = lower(name);
      for (const map of visible ? [unit.intf, unit.all] : [unit.all]) {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(sym);
      }
    };
    for (const decl of decls) {
      switch (decl.k) {
        case 'type': {
          const sym = { kind: 'type', name: decl.name, decl, unit, outer: null };
          add(decl.name, sym);
          this.registerType(sym);
          break;
        }
        case 'var':
          for (const name of decl.names) add(name, { kind: 'var', name, type: decl.type, unit });
          break;
        case 'const':
          add(decl.name, { kind: 'const', name: decl.name, type: decl.type, unit });
          break;
        case 'routine': {
          if (decl.className) {
            if (decl.body) unit.bodies.add(methodId(unit.name, decl.className, decl.name));
            break;
          }
          const key = lower(decl.name);
          const existing = (unit.all.get(key) || []).find((s) => s.kind === 'routine');
          const sym = existing || {
            kind: 'routine',
            name: decl.name,
            unit,
            headings: [],
            id: methodId(unit.name, null, decl.name),
            hasBody: false,
          };
          sym.headings.push(decl);
          if (decl.body) sym.hasBody = true;
          if (!existing) add(decl.name, sym);
          else if (visible && !unit.intf.has(key)) unit.intf.set(key, [sym]);
          break;
        }
        default:
          break;
      }
    }
  }

  registerType(sym) {
    const spec = sym.decl.spec;
    if (spec.k !== 'class' || spec.forward) return;
    const ent = {
      name: sym.name,
      qualifiedName: sym.outer ? `${sym.outer.qualifiedName}.${sym.name}` : sym.name,
      kind: spec.kind === 'object' ? 'class' : spec.kind,
      sym,
      unit: sym.unit,
      spec,
      typeParams: sym.decl.typeParams || [],
      members: new Map(),
      nested: new Map(),
      defaultProp: null,
      ancestorCache: undefined,
      interfacesCache: undefined,
    };
    sym.ent = ent;
    this.entityByDecl.set(sym.decl, ent);
    this.entities.push(ent);
    for (const member of spec.members) {
      const add = (name, entry) => {
        const key = lower(name);
        if (!ent.members.has(key)) ent.members.set(key, []);
        ent.members.get(key).push(entry);
      };
      if (member.k === 'field') {
        for (const name of member.names) add(name, { kind: 'field', name, type: member.type, owner: ent });
      } else if (member.k === 'method') {
        const r = member.routine;
        add(r.name, {
          kind: 'method',
          name: r.name,
          routine: r,
          owner: ent,
          isClass: member.isClass,
          directives: new Set(r.directives),
          id: methodId(ent.unit.name, ent.qualifiedName, r.name),
        });
      } else if (member.k === 'property') {
        const entry = { kind: 'property', name: member.name, prop: member, owner: ent };
        add(member.name, entry);
        if (member.isDefault) ent.defaultProp = entry;
      } else if (member.k === 'const') {
        add(member.name, { kind: 'const', name: member.name, type: member.type, owner: ent });
      } else if (member.k === 'type') {
        const nestedSym = { kind: 'type', name: member.name, decl: member, unit: ent.unit, outer: ent };
        ent.nested.set(lower(member.name), nestedSym);
        this.registerType(nestedSym);
      }
    }
    if (spec.helperFor) ent.helperFor = spec.helperFor;
  }

  // Depois de todas as Units: helpers e o mapa de descendentes.
  finish() {
    for (const ent of this.entities) {
      if (!ent.helperFor) continue;
      const target = this.resolveType(ent.helperFor, { unit: ent.unit });
      if (target && target.ent) {
        if (!this.helpers.has(target.ent)) this.helpers.set(target.ent, []);
        this.helpers.get(target.ent).push(ent);
      }
    }
    this.children = new Map();
    for (const ent of this.entities) {
      const parent = this.ancestorOf(ent);
      if (!parent) continue;
      if (!this.children.has(parent.ent)) this.children.set(parent.ent, []);
      this.children.get(parent.ent).push(ent);
    }
  }

  hasBody(member) {
    return member.kind === 'method' && member.owner.unit.bodies.has(member.id);
  }

  // ------------------------------------------------------------ escopo de Unit
  unitByName(name) {
    const key = lower(name);
    return this.units.get(key) || this.units.get(`system.${key}`) || null;
  }

  // Unidades visíveis a partir de `unit`, da mais interna para a mais externa:
  // a própria Unit, as `uses` da implementation (da última para a primeira),
  // as da interface, e por fim `System`.
  visibleUnits(unit) {
    if (unit.visibleCache) return unit.visibleCache;
    const result = [];
    const pushUses = (names) => {
      for (let i = names.length - 1; i >= 0; i--) {
        const used = this.unitByName(names[i]);
        if (used && used !== unit && !result.includes(used)) result.push(used);
      }
    };
    pushUses(unit.usesImpl);
    pushUses(unit.usesIntf);
    const system = this.units.get('system');
    if (system && system !== unit && !result.includes(system)) result.push(system);
    unit.visibleCache = result;
    return result;
  }

  // Símbolos com esse nome visíveis na Unit (os da própria Unit primeiro).
  lookupGlobal(name, unit) {
    const key = lower(name);
    const own = unit.all.get(key);
    if (own) return own;
    for (const used of this.visibleUnits(unit)) {
      const syms = used.intf.get(key);
      if (syms) return syms;
    }
    return null;
  }

  // Prefixo de nome de Unit (`System`, `System.Generics`) ou Unit completa.
  unitPrefix(prefix) {
    const key = lower(prefix);
    if (this.units.has(key)) return { unit: this.units.get(key) };
    for (const name of this.units.keys()) if (name.startsWith(`${key}.`)) return { prefix: key };
    return null;
  }

  // ------------------------------------------------------------ tipos
  // `ctx`: { unit, ent?, bind?, locals? (Map nome → sym de tipo local),
  //          typeParams? (parâmetros genéricos de um método) }
  resolveType(ast, ctx) {
    if (!ast) return null;
    switch (ast.k) {
      case 'named':
        return this.resolveNamedType(ast, ctx);
      case 'array':
        return { t: 'array', elem: this.resolveType(ast.of, ctx) };
      case 'pointer':
        return { t: 'ptr', to: this.resolveType(ast.to, ctx) };
      case 'classof': {
        const target = this.resolveType(ast.type, ctx);
        return target && target.ent ? { t: 'meta', ent: target.ent, bind: target.bind } : null;
      }
      case 'proc':
        return { t: 'proc', spec: ast, ctx };
      case 'class':
        return null;
      default:
        return null;
    }
  }

  resolveNamedType(ast, ctx) {
    const parts = ast.name;
    const head = lower(parts[0]);
    if (parts.length === 1 && (head === 'string' || head === 'file')) return null;
    const args = ast.args || [];

    if (parts.length === 1) {
      // 1. parâmetros genéricos já ligados
      if (ctx.bind && ctx.bind.has(head)) return ctx.bind.get(head);
      // 2. parâmetros genéricos ainda livres: valem como a constraint
      const free = this.freeTypeParam(head, ctx);
      if (free !== undefined) return free;
      // 3. tipos locais da routine
      if (ctx.locals && ctx.locals.has(head)) return this.typeValFromSym(ctx.locals.get(head), args, ctx);
      // 4. tipos aninhados da classe e de seus ancestrais
      for (let ent = ctx.ent; ent; ent = ent.sym.outer) {
        // Ao resolver a própria lista de herança, os ancestrais ainda não
        // são conhecidos: só os tipos aninhados declarados na classe valem.
        const nested = ctx.inHeritage && ent === ctx.ent ? ent.nested.get(head) : this.findNested(ent, head);
        if (nested) return this.typeValFromSym(nested, args, ctx);
      }
      const syms = this.lookupGlobal(parts[0], ctx.unit);
      const sym = syms && pickType(syms, args.length);
      return sym ? this.typeValFromSym(sym, args, ctx) : null;
    }

    // Nome qualificado: `Unit.TFoo`, `System.Generics.Collections.TList`,
    // ou tipo aninhado `TOuter.TInner`.
    for (let split = parts.length - 1; split >= 1; split--) {
      const unit = this.units.get(lower(parts.slice(0, split).join('.')));
      if (!unit) continue;
      let sym = pickType(unit.intf.get(lower(parts[split])) || unit.all.get(lower(parts[split])) || [], split === parts.length - 1 ? args.length : 0);
      for (let i = split + 1; sym && i < parts.length; i++) {
        sym = sym.ent ? sym.ent.nested.get(lower(parts[i])) : null;
      }
      return sym ? this.typeValFromSym(sym, args, ctx) : null;
    }
    let val = this.resolveNamedType({ k: 'named', name: [parts[0]], args: [] }, ctx);
    for (let i = 1; val && val.ent && i < parts.length; i++) {
      const nested = this.findNested(val.ent, lower(parts[i]));
      val = nested ? this.typeValFromSym(nested, i === parts.length - 1 ? args : [], ctx) : null;
    }
    return val;
  }

  findNested(ent, key) {
    for (let current = { ent, bind: null }; current; current = this.ancestorOf(current.ent)) {
      const nested = current.ent.nested.get(key);
      if (nested) return nested;
    }
    return null;
  }

  // `undefined` = não é parâmetro genérico; `null` = parâmetro sem constraint.
  freeTypeParam(key, ctx) {
    const params = [...(ctx.typeParams || [])];
    for (let ent = ctx.ent; ent; ent = ent.sym.outer) params.push(...ent.typeParams);
    const param = params.find((p) => lower(p.name) === key);
    if (!param) return undefined;
    if (!param.constraint) return null;
    const owner = ctx.ent || null;
    return this.resolveType(param.constraint, { unit: ctx.unit, ent: owner && owner.sym.outer, bind: null });
  }

  typeValFromSym(sym, args, ctx) {
    if (sym.kind !== 'type') return null;
    const spec = sym.decl.spec;
    const bindArgs = (params) => {
      const bind = new Map();
      params.forEach((param, i) => {
        if (i < args.length) bind.set(lower(param.name), this.resolveType(args[i], ctx));
      });
      return bind;
    };
    if (sym.ent) return { t: 'obj', ent: sym.ent, bind: bindArgs(sym.ent.typeParams) };
    // Alias (inclusive genérico, como `TArray<T> = array of T`): resolvido no
    // contexto da declaração, com os argumentos ligados.
    if (sym.resolving) return null;
    sym.resolving = true;
    try {
      const declCtx = { unit: sym.unit, ent: sym.outer, bind: bindArgs(sym.decl.typeParams || []) };
      return this.resolveType(spec, declCtx);
    } finally {
      sym.resolving = false;
    }
  }

  // ------------------------------------------------------------ herança
  // Ancestral (classe) de `ent`, como { ent, bind } no contexto de `bind`.
  ancestorOf(ent, bind = null) {
    const refs = ent.spec.ancestors;
    if (ent.kind === 'interface') {
      if (!refs.length) return null;
      const val = this.resolveType(refs[0], { unit: ent.unit, ent, bind, inHeritage: true });
      return val && val.ent && val.ent.kind === 'interface' ? val : null;
    }
    if (ent.kind === 'record') return null;
    let val = null;
    if (refs.length) {
      val = this.resolveType(refs[0], { unit: ent.unit, ent, bind, inHeritage: true });
      if (val && val.ent && val.ent.kind === 'interface') val = null;
      if (val && val.ent === ent) val = null;
    } else if (lower(ent.name) !== 'tobject' || !ent.unit.isStub) {
      const tobject = this.units.get('system')?.intf.get('tobject');
      if (tobject && tobject[0].ent !== ent) val = { t: 'obj', ent: tobject[0].ent, bind: new Map() };
    }
    return val && val.ent ? val : null;
  }

  // Interfaces declaradas diretamente por uma classe (ou ancestrais de uma
  // interface).
  declaredInterfaces(ent) {
    if (ent.interfacesCache) return ent.interfacesCache;
    const result = [];
    for (const ref of ent.spec.ancestors) {
      const val = this.resolveType(ref, { unit: ent.unit, ent, bind: null, inHeritage: true });
      if (val && val.ent && val.ent.kind === 'interface' && val.ent !== ent) result.push(val.ent);
    }
    ent.interfacesCache = result;
    return result;
  }

  // Todas as interfaces que uma classe implementa, direta ou indiretamente.
  allInterfaces(ent) {
    const result = new Set();
    const visitIntf = (intf) => {
      if (result.has(intf)) return;
      result.add(intf);
      for (const parent of this.declaredInterfaces(intf)) visitIntf(parent);
    };
    for (let current = { ent }; current; current = this.ancestorOf(current.ent)) {
      for (const intf of this.declaredInterfaces(current.ent)) visitIntf(intf);
    }
    return result;
  }

  isInterfaceDescendant(intf, base) {
    const seen = new Set();
    const visit = (e) => {
      if (e === base) return true;
      if (seen.has(e)) return false;
      seen.add(e);
      return this.declaredInterfaces(e).some(visit);
    };
    return visit(intf);
  }

  descendants(ent) {
    const result = [];
    const visit = (e) => {
      for (const child of this.children.get(e) || []) {
        result.push(child);
        visit(child);
      }
    };
    visit(ent);
    return result;
  }

  // ------------------------------------------------------------ membros
  // Procura um membro a partir de `val` (obj/meta), subindo pelos ancestrais
  // (e pelas interfaces ancestrais, para interfaces). Devolve
  // { member, owner: { ent, bind } } ou null.
  findMember(val, name, { startAtAncestor = false } = {}) {
    if (!val || !val.ent) return null;
    const key = lower(name);
    const seen = new Set();
    let current = startAtAncestor ? this.ancestorOf(val.ent, val.bind) : { ent: val.ent, bind: val.bind };
    const queue = [];
    while (current) {
      if (seen.has(current.ent)) break;
      seen.add(current.ent);
      for (const helper of this.helpers.get(current.ent) || []) {
        const found = helper.members.get(key);
        if (found) return { member: found[0], members: found, owner: { ent: helper, bind: current.bind } };
      }
      const found = current.ent.members.get(key);
      if (found) return { member: found[0], members: found, owner: current };
      if (current.ent.kind === 'interface') {
        for (const intf of this.declaredInterfaces(current.ent)) queue.push({ ent: intf, bind: null });
        current = queue.shift() || null;
      } else {
        current = this.ancestorOf(current.ent, current.bind);
      }
    }
    return null;
  }

  // Tipo de um membro (campo, property, retorno de método) no contexto do
  // dono, com os parâmetros genéricos ligados.
  memberType(member, owner, typeAst) {
    return this.resolveType(typeAst, { unit: owner.ent.unit, ent: owner.ent, bind: owner.bind });
  }

  // Tipo do elemento percorrido por `for..in`.
  enumeratedType(val) {
    if (!val) return null;
    if (val.t === 'array') return val.elem;
    if (val.t !== 'obj') return null;
    const getEnumerator = this.findMember(val, 'GetEnumerator');
    if (!getEnumerator || getEnumerator.member.kind !== 'method') return null;
    const enumerator = this.memberType(getEnumerator.member, getEnumerator.owner, getEnumerator.member.routine.returnType);
    const current = enumerator && this.findMember(enumerator, 'Current');
    if (!current || current.member.kind !== 'property') return null;
    return this.memberType(current.member, current.owner, current.member.prop.type);
  }

  // Classe/record de um método implementado (`TFoo.Bar`, `TOuter.TInner.Baz`).
  entityForClassName(unit, className) {
    const parts = className.split('.');
    let sym = pickType(unit.all.get(lower(parts[0])) || [], -1);
    for (let i = 1; sym && i < parts.length; i++) sym = sym.ent ? sym.ent.nested.get(lower(parts[i])) : null;
    return sym && sym.ent ? sym.ent : null;
  }
}

// Escolhe o símbolo de tipo com a aridade genérica pedida (`TList` ×
// `TList<T>`); `-1` aceita qualquer uma.
function pickType(syms, arity) {
  const types = syms.filter((s) => s.kind === 'type');
  if (!types.length) return null;
  const arityOf = (s) => (s.decl.typeParams || []).length;
  if (arity < 0) return types.find((s) => s.ent) || types[0];
  return types.find((s) => arityOf(s) === arity && !(s.decl.spec.forward)) || types.find((s) => !s.decl.spec.forward) || types[0];
}

export function buildSymbolTable(units) {
  const table = new SymbolTable();
  for (const { ast, isStub, isProgram } of units) table.addUnit(ast, { isStub, isProgram });
  table.finish();
  return table;
}
