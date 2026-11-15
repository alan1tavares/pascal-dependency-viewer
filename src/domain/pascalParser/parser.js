// Parser recursivo-descendente para Delphi (ADR 0006, design D1).
// `parseSource(fonte)` devolve a AST de uma Unit (`k: 'unit'`) ou de um
// Program/Library (`k: 'program'`). Erros viram `ParseError` com linha/coluna.

import preprocess from './preprocess.js';
import tokenize, { ParseError } from './lexer.js';

export { ParseError };

const ROUTINE_DIRECTIVES = new Set([
  'abstract', 'assembler', 'cdecl', 'deprecated', 'dispid', 'dynamic', 'experimental',
  'export', 'external', 'far', 'final', 'forward', 'inline', 'library', 'local', 'message',
  'near', 'overload', 'override', 'pascal', 'platform', 'reintroduce', 'register',
  'safecall', 'static', 'stdcall', 'varargs', 'virtual', 'winapi', 'unsafe', 'delayed',
]);
const TYPE_DIRECTIVES = new Set([
  'stdcall', 'cdecl', 'register', 'pascal', 'safecall', 'winapi', 'deprecated', 'platform',
  'experimental', 'library',
]);
const VISIBILITY = new Set(['private', 'protected', 'public', 'published', 'automated']);
const PROPERTY_SPECIFIERS = new Set([
  'read', 'write', 'stored', 'default', 'nodefault', 'implements', 'index', 'readonly',
  'writeonly', 'dispid', 'add', 'remove',
]);
const SECTION_END = new Set([
  'implementation', 'initialization', 'finalization', 'begin', 'end', 'asm',
]);
const STATEMENT_END = new Set(['end', 'else', 'until', 'except', 'finally']);
const ROUTINE_KEYWORDS = new Set(['procedure', 'function', 'constructor', 'destructor']);
const REL_OPS = new Set(['=', '<>', '<', '>', '<=', '>=']);
const ADD_OPS = new Set(['+', '-']);
const MUL_OPS = new Set(['*', '/']);
const MUL_KWS = new Set(['div', 'mod', 'and', 'shl', 'shr', 'as']);
const ADD_KWS = new Set(['or', 'xor']);

export function parseSource(source, options = {}) {
  const { tokens, directives } = tokenize(preprocess(source, options));
  const parser = new Parser(tokens);
  const ast = parser.parseGoal();
  ast.resources = directives.filter((d) => d.name === 'R' || d.name === 'RESOURCE').map((d) => d.arg);
  return ast;
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  // ---------------------------------------------------------------- utilitários
  peek(offset = 0) {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)];
  }
  next() {
    const token = this.peek();
    if (this.pos < this.tokens.length - 1) this.pos++;
    return token;
  }
  isKw(word, offset = 0) {
    const t = this.peek(offset);
    return t.type === 'kw' && t.lower === word;
  }
  isWord(word, offset = 0) {
    const t = this.peek(offset);
    return (t.type === 'ident' || t.type === 'kw') && t.lower === word;
  }
  isOp(value, offset = 0) {
    const t = this.peek(offset);
    return t.type === 'op' && t.value === value;
  }
  isIdent(offset = 0) {
    return this.peek(offset).type === 'ident';
  }
  acceptOp(value) {
    if (!this.isOp(value)) return false;
    this.next();
    return true;
  }
  acceptKw(word) {
    if (!this.isKw(word)) return false;
    this.next();
    return true;
  }
  error(message, token = this.peek()) {
    const found = token.type === 'eof' ? 'fim do arquivo' : `'${token.value}'`;
    return new ParseError(`${message}, encontrado ${found}`, token.line, token.col);
  }
  expectOp(value) {
    if (!this.isOp(value)) throw this.error(`Esperado '${value}'`);
    return this.next();
  }
  expectKw(word) {
    if (!this.isKw(word)) throw this.error(`Esperado '${word}'`);
    return this.next();
  }
  expectIdent() {
    if (!this.isIdent()) throw this.error('Esperado identificador');
    return this.next();
  }
  // Nome após '.', onde palavras reservadas podem aparecer (`Obj.Type` é
  // inválido, mas `TFoo.Create` e afins são comuns e sempre identificadores).
  expectMemberName() {
    const t = this.peek();
    if (t.type === 'ident' || (t.type === 'kw' && /^[a-z]/.test(t.lower))) return this.next();
    throw this.error('Esperado identificador');
  }
  qualifiedName() {
    const parts = [this.expectIdent().value];
    while (this.isOp('.') && this.peek(1).type !== 'eof' && (this.isIdent(1) || this.peek(1).type === 'kw')) {
      this.next();
      parts.push(this.expectMemberName().value);
    }
    return parts.join('.');
  }
  // Pula um bloco balanceado começando no token atual (`(`, `[` ou `<`).
  skipBalanced(open, close) {
    let depth = 0;
    do {
      const t = this.next();
      if (t.type === 'eof') throw this.error(`Esperado '${close}'`, t);
      if (t.type === 'op' && t.value === open) depth++;
      else if (t.type === 'op' && t.value === close) depth--;
    } while (depth > 0);
  }
  skipUntilSemicolon() {
    while (!this.isOp(';') && this.peek().type !== 'eof') {
      if (this.isOp('(')) this.skipBalanced('(', ')');
      else if (this.isOp('[')) this.skipBalanced('[', ']');
      else this.next();
    }
  }
  skipAttributes() {
    while (this.isOp('[')) this.skipBalanced('[', ']');
  }
  pos0() {
    const t = this.peek();
    return { line: t.line, col: t.col };
  }

  // ---------------------------------------------------------------- Unit / Program
  parseGoal() {
    if (this.isKw('unit')) return this.parseUnit();
    if (this.isKw('program') || this.isKw('library')) return this.parseProgram();
    throw this.error("Esperado 'unit', 'program' ou 'library'");
  }

  parseUnit() {
    this.expectKw('unit');
    const name = this.qualifiedName();
    this.skipUntilSemicolon();
    this.expectOp(';');
    this.expectKw('interface');
    const intfUses = this.parseUses();
    const intfDecls = this.parseDeclarations({ section: 'interface' });
    this.expectKw('implementation');
    const implUses = this.parseUses();
    const implDecls = this.parseDeclarations({ section: 'implementation' });
    let init = null;
    let final = null;
    if (this.acceptKw('initialization')) {
      init = this.statementList(new Set(['finalization', 'end']));
      if (this.acceptKw('finalization')) final = this.statementList(new Set(['end']));
    } else if (this.acceptKw('begin')) {
      init = this.statementList(new Set(['end']));
    }
    this.expectKw('end');
    this.expectOp('.');
    return {
      k: 'unit',
      name,
      intf: { uses: intfUses, decls: intfDecls },
      impl: { uses: implUses, decls: implDecls },
      init,
      final,
    };
  }

  parseProgram() {
    const kind = this.next().lower;
    const name = this.qualifiedName();
    if (this.isOp('(')) this.skipBalanced('(', ')');
    this.expectOp(';');
    const uses = this.parseUses();
    const decls = this.parseDeclarations({ section: 'program' });
    this.expectKw('begin');
    const body = this.statementList(new Set(['end']));
    this.expectKw('end');
    this.expectOp('.');
    return { k: 'program', kind, name, uses, decls, body };
  }

  parseUses() {
    const uses = [];
    if (!this.acceptKw('uses')) return uses;
    do {
      const name = this.qualifiedName();
      let path = null;
      if (this.acceptKw('in')) {
        if (this.peek().type !== 'str') throw this.error('Esperado caminho entre aspas');
        path = this.next().value;
      }
      uses.push({ name, path });
    } while (this.acceptOp(','));
    this.expectOp(';');
    return uses;
  }

  // ---------------------------------------------------------------- declarações
  parseDeclarations({ section }) {
    const decls = [];
    for (;;) {
      const t = this.peek();
      if (t.type === 'eof') break;
      if (t.type === 'kw' && SECTION_END.has(t.lower)) break;
      if (this.isOp('[')) {
        this.skipAttributes();
        continue;
      }
      if (this.acceptKw('type')) {
        decls.push(...this.typeSection());
      } else if (this.isKw('var') || this.isKw('threadvar')) {
        this.next();
        decls.push(...this.varSection());
      } else if (this.isKw('const') || this.isKw('resourcestring')) {
        this.next();
        decls.push(...this.constSection());
      } else if (this.isKw('label') || this.isKw('exports')) {
        this.skipUntilSemicolon();
        this.expectOp(';');
      } else if (this.isRoutineStart()) {
        decls.push(this.routine({ withBody: section !== 'interface' }));
      } else {
        throw this.error('Declaração inesperada');
      }
    }
    return decls;
  }

  isRoutineStart() {
    if (this.isKw('class') && (ROUTINE_KEYWORDS.has(this.peek(1).lower) || this.isWord('operator', 1))) return true;
    const t = this.peek();
    return t.type === 'kw' && ROUTINE_KEYWORDS.has(t.lower);
  }

  // Lista `A, B: T;` até não haver mais identificador seguido de `,`/`:`.
  varSection() {
    const decls = [];
    while (this.isIdent() || this.isOp('[')) {
      if (this.isOp('[')) {
        this.skipAttributes();
        continue;
      }
      const start = this.pos0();
      const names = [this.expectIdent().value];
      while (this.acceptOp(',')) names.push(this.expectIdent().value);
      this.expectOp(':');
      const type = this.typeSpec();
      let value = null;
      if (this.isWord('absolute')) {
        this.next();
        this.expression();
      } else if (this.acceptOp('=')) {
        value = this.constValue();
      }
      this.skipPortability();
      this.expectOp(';');
      decls.push({ k: 'var', names, type, value, ...start });
    }
    return decls;
  }

  constSection() {
    const decls = [];
    while (this.isIdent() || this.isOp('[')) {
      if (this.isOp('[')) {
        this.skipAttributes();
        continue;
      }
      const start = this.pos0();
      const name = this.expectIdent().value;
      let type = null;
      if (this.acceptOp(':')) type = this.typeSpec();
      this.expectOp('=');
      const value = this.constValue();
      this.skipPortability();
      this.expectOp(';');
      decls.push({ k: 'const', name, type, value, ...start });
    }
    return decls;
  }

  // Valores de constantes tipadas podem ser `(a, b)` ou `(X: 1; Y: 2)`,
  // que não são expressões; esses são pulados.
  constValue() {
    if (this.isOp('(') && this.looksLikeStructuredConst()) {
      this.skipBalanced('(', ')');
      return null;
    }
    return this.expression();
  }
  looksLikeStructuredConst() {
    let depth = 0;
    for (let i = this.pos; i < this.tokens.length; i++) {
      const t = this.tokens[i];
      if (t.type === 'op' && t.value === '(') depth++;
      else if (t.type === 'op' && t.value === ')') {
        depth--;
        if (depth === 0) return false;
      } else if (depth === 1 && t.type === 'op' && (t.value === ',' || t.value === ';' || t.value === ':')) return true;
      else if (t.type === 'eof') return false;
    }
    return false;
  }

  skipPortability() {
    while (this.isWord('deprecated') || this.isWord('platform') || this.isWord('experimental') || this.isKw('library')) {
      this.next();
      if (this.peek().type === 'str') this.next();
    }
  }

  typeSection() {
    const decls = [];
    while (this.isIdent() || this.isOp('[')) {
      if (this.isOp('[')) {
        this.skipAttributes();
        continue;
      }
      decls.push(this.typeDecl());
    }
    return decls;
  }

  typeDecl() {
    const start = this.pos0();
    const name = this.expectIdent().value;
    const typeParams = this.isOp('<') ? this.typeParams() : [];
    this.expectOp('=');
    this.acceptKw('type');
    const spec = this.typeSpec({ declaring: true });
    this.skipPortability();
    this.expectOp(';');
    // Diretivas de tipo procedural depois do ';' (`procedure; stdcall;`).
    while (this.isIdent() && TYPE_DIRECTIVES.has(this.peek().lower) && !this.isOp('=', 1)) {
      this.skipUntilSemicolon();
      this.expectOp(';');
    }
    return { k: 'type', name, typeParams, spec, ...start };
  }

  typeParams() {
    this.expectOp('<');
    const params = [];
    do {
      const group = [this.expectIdent().value];
      while (this.acceptOp(',')) group.push(this.expectIdent().value);
      let constraint = null;
      if (this.acceptOp(':')) {
        do {
          if (this.isKw('class') || this.isKw('record') || this.isWord('constructor') || this.isKw('constructor')) {
            this.next();
          } else {
            const type = this.typeRef();
            if (!constraint) constraint = type;
          }
        } while (this.acceptOp(','));
      }
      for (const name of group) params.push({ name, constraint });
    } while (this.acceptOp(';'));
    this.expectOp('>');
    return params;
  }

  // Referência a tipo: `string`, `Unit.TFoo`, `TList<TFoo>`.
  typeRef() {
    if (this.isKw('string')) {
      this.next();
      if (this.isOp('[')) this.skipBalanced('[', ']');
      return { k: 'named', name: ['string'], args: [] };
    }
    if (this.isKw('file')) {
      this.next();
      return { k: 'named', name: ['file'], args: [] };
    }
    const name = [this.expectIdent().value];
    let args = [];
    for (;;) {
      if (this.isOp('<')) {
        args = this.typeArgs();
        continue;
      }
      if (this.isOp('.') && (this.isIdent(1) || this.peek(1).type === 'kw') && !this.isOp('.', 1)) {
        this.next();
        name.push(this.expectMemberName().value);
        args = [];
        continue;
      }
      break;
    }
    return { k: 'named', name, args };
  }

  typeArgs() {
    this.expectOp('<');
    const args = [];
    do args.push(this.typeSpec()); while (this.acceptOp(','));
    this.expectOp('>');
    return args;
  }

  typeSpec({ declaring = false } = {}) {
    if (this.acceptKw('packed')) return this.typeSpec({ declaring });
    const t = this.peek();
    if (t.type === 'kw') {
      switch (t.lower) {
        case 'class':
          return this.classType();
        case 'object':
          this.next();
          return this.structuredType('object');
        case 'record':
          return this.recordType();
        case 'interface':
        case 'dispinterface':
          return this.interfaceType();
        case 'procedure':
        case 'function':
          return this.procType();
        case 'array':
          return this.arrayType();
        case 'set':
          this.next();
          this.expectKw('of');
          return { k: 'set', of: this.typeSpec() };
        case 'file':
          this.next();
          if (this.acceptKw('of')) this.typeSpec();
          return { k: 'named', name: ['file'], args: [] };
        case 'string':
          return this.typeRef();
        default:
          break;
      }
    }
    if (this.isWord('reference') && this.isKw('to', 1)) {
      this.next();
      this.next();
      const proc = this.procType();
      proc.reference = true;
      return proc;
    }
    if (this.isOp('^')) {
      this.next();
      return { k: 'pointer', to: this.typeRef() };
    }
    if (this.isOp('(')) {
      this.next();
      const names = [];
      do {
        names.push(this.expectIdent().value);
        if (this.acceptOp('=')) this.expression();
      } while (this.acceptOp(','));
      this.expectOp(')');
      return { k: 'enum', names };
    }
    if (this.isIdent() && !this.isOp('..', this.identChainLength())) {
      return this.typeRef();
    }
    // Subfaixa: `1..10`, `'a'..'z'`, `Low(X)..High(X)`.
    this.simpleExpression();
    this.expectOp('..');
    this.simpleExpression();
    return { k: 'subrange' };
  }

  // Quantos tokens tem `A.B.C` a partir da posição atual (para detectar
  // subfaixas como `TEnum.A..TEnum.C`).
  identChainLength() {
    let i = 1;
    while (this.isOp('.', i) && this.peek(i + 1).type === 'ident') i += 2;
    return i;
  }

  procType() {
    const kind = this.next().lower;
    const params = this.isOp('(') ? this.params() : [];
    let returnType = null;
    if (kind === 'function') {
      this.expectOp(':');
      returnType = this.typeRef();
    }
    let ofObject = false;
    if (this.isKw('of') && this.isKw('object', 1)) {
      this.next();
      this.next();
      ofObject = true;
    }
    while (this.isIdent() && TYPE_DIRECTIVES.has(this.peek().lower)) this.next();
    return { k: 'proc', kind, params, returnType, ofObject, reference: false };
  }

  arrayType() {
    this.expectKw('array');
    if (this.isOp('[')) this.skipBalanced('[', ']');
    this.expectKw('of');
    if (this.acceptKw('const')) return { k: 'array', of: null };
    return { k: 'array', of: this.typeSpec() };
  }

  classType() {
    this.expectKw('class');
    if (this.acceptKw('of')) return { k: 'classof', type: this.typeRef() };
    if (this.isOp(';')) return { k: 'class', kind: 'class', forward: true, ancestors: [], members: [] };
    if (this.isWord('helper')) {
      this.next();
      const ancestors = this.isOp('(') ? this.ancestorList() : [];
      this.expectKw('for');
      const helperFor = this.typeRef();
      return { ...this.classBody('class', ancestors), helperFor };
    }
    while (this.isWord('abstract') || this.isWord('sealed')) this.next();
    return this.structuredType('class');
  }

  structuredType(kind) {
    const ancestors = this.isOp('(') ? this.ancestorList() : [];
    // `TFoo = class(TBase);` — declaração curta, sem corpo.
    if (this.isOp(';')) return { k: 'class', kind, forward: false, ancestors, members: [] };
    return this.classBody(kind, ancestors);
  }

  ancestorList() {
    this.expectOp('(');
    const list = [];
    do list.push(this.typeRef()); while (this.acceptOp(','));
    this.expectOp(')');
    return list;
  }

  recordType() {
    this.expectKw('record');
    if (this.isWord('helper')) {
      this.next();
      this.expectKw('for');
      const helperFor = this.typeRef();
      return { ...this.classBody('record', []), helperFor };
    }
    return this.classBody('record', []);
  }

  interfaceType() {
    const kind = this.next().lower === 'dispinterface' ? 'dispinterface' : 'interface';
    if (this.isOp(';')) return { k: 'class', kind: 'interface', forward: true, ancestors: [], members: [] };
    const ancestors = this.isOp('(') ? this.ancestorList() : [];
    return this.classBody(kind === 'dispinterface' ? 'interface' : kind, ancestors);
  }

  classBody(kind, ancestors) {
    const members = this.memberList(new Set(['end']), kind);
    this.expectKw('end');
    return { k: 'class', kind, forward: false, ancestors, members };
  }

  // Membros de class/record/interface até um dos terminadores.
  memberList(terminators, kind) {
    const members = [];
    let visibility = kind === 'class' ? 'published' : 'public';
    let mode = 'field'; // field | const | type
    for (;;) {
      const t = this.peek();
      if (t.type === 'eof') throw this.error("Esperado 'end'");
      if ((t.type === 'kw' || t.type === 'op') && terminators.has(t.value.toLowerCase())) break;
      if (this.isOp('[')) {
        this.skipAttributes();
        continue;
      }
      if (this.isWord('strict') && VISIBILITY.has(this.peek(1).lower)) {
        this.next();
        visibility = this.next().lower;
        mode = 'field';
        continue;
      }
      if (t.type === 'ident' && VISIBILITY.has(t.lower)) {
        visibility = this.next().lower;
        mode = 'field';
        continue;
      }
      let isClass = false;
      if (this.isKw('class') && (ROUTINE_KEYWORDS.has(this.peek(1).lower) || ['property', 'var', 'operator'].includes(this.peek(1).lower))) {
        this.next();
        isClass = true;
      }
      if (this.isKw('case')) {
        members.push(...this.variantPart());
        continue;
      }
      if (this.isRoutineKeyword() || this.isWord('operator')) {
        const heading = this.routine({ withBody: false, inClass: true });
        if (heading) members.push({ k: 'method', routine: heading, isClass: isClass || heading.isClass, visibility });
        mode = 'field';
        continue;
      }
      if (this.isKw('property')) {
        members.push({ ...this.property(), isClass, visibility });
        mode = 'field';
        continue;
      }
      if (this.isKw('var')) {
        this.next();
        mode = 'field';
        continue;
      }
      if (this.acceptKw('const')) {
        mode = 'const';
        continue;
      }
      if (this.acceptKw('type')) {
        mode = 'type';
        continue;
      }
      if (mode === 'const' && this.isIdent()) {
        for (const decl of this.constSectionOne()) members.push({ ...decl, visibility });
        continue;
      }
      if (mode === 'type' && this.isIdent()) {
        members.push({ ...this.typeDecl(), visibility });
        continue;
      }
      if (this.isIdent()) {
        members.push({ ...this.fieldDecl(), isClass, visibility });
        continue;
      }
      if (this.acceptOp(';')) continue;
      throw this.error('Membro inesperado');
    }
    return members;
  }

  isRoutineKeyword() {
    const t = this.peek();
    return t.type === 'kw' && ROUTINE_KEYWORDS.has(t.lower);
  }

  constSectionOne() {
    const start = this.pos0();
    const name = this.expectIdent().value;
    let type = null;
    if (this.acceptOp(':')) type = this.typeSpec();
    this.expectOp('=');
    const value = this.constValue();
    this.skipPortability();
    this.expectOp(';');
    return [{ k: 'const', name, type, value, ...start }];
  }

  fieldDecl() {
    const start = this.pos0();
    const names = [this.expectIdent().value];
    while (this.acceptOp(',')) names.push(this.expectIdent().value);
    this.expectOp(':');
    const type = this.typeSpec();
    this.skipPortability();
    if (!this.isKw('end') && !this.isOp(')')) this.expectOp(';');
    return { k: 'field', names, type, ...start };
  }

  // `case Tag: T of 1: (A: Integer); 2: (B, C: Byte);` dentro de records.
  variantPart() {
    this.expectKw('case');
    if (this.isIdent() && this.isOp(':', 1)) {
      this.next();
      this.next();
    }
    this.typeRef();
    this.expectKw('of');
    const members = [];
    while (!this.isKw('end') && !this.isOp(')')) {
      do {
        this.expression();
        if (this.acceptOp('..')) this.expression();
      } while (this.acceptOp(','));
      this.expectOp(':');
      this.expectOp('(');
      members.push(...this.memberList(new Set([')']), 'record'));
      this.expectOp(')');
      this.acceptOp(';');
    }
    return members;
  }

  property() {
    const start = this.pos0();
    this.expectKw('property');
    const name = this.expectIdent().value;
    let params = [];
    if (this.isOp('[')) {
      params = this.params('[', ']');
    }
    let type = null;
    if (this.acceptOp(':')) type = this.typeRef();
    const prop = { k: 'property', name, params, type, read: null, write: null, isDefault: false, ...start };
    while (!this.isOp(';')) {
      const t = this.peek();
      if (t.type === 'eof') throw this.error("Esperado ';'");
      const word = t.lower;
      if ((t.type === 'ident' || t.type === 'kw') && PROPERTY_SPECIFIERS.has(word)) {
        this.next();
        if (word === 'read' || word === 'write' || word === 'add' || word === 'remove') {
          const accessor = [this.expectIdent().value];
          while (this.isOp('.') || this.isOp('[')) {
            if (this.acceptOp('.')) accessor.push(this.expectIdent().value);
            else this.skipBalanced('[', ']');
          }
          if (word === 'read') prop.read = accessor;
          if (word === 'write') prop.write = accessor;
        } else if (word === 'implements') {
          do this.typeRef(); while (this.acceptOp(','));
        } else if (word === 'nodefault' || word === 'readonly' || word === 'writeonly') {
          // sem argumento
        } else {
          this.expression();
        }
        continue;
      }
      throw this.error('Especificador de property inesperado');
    }
    this.expectOp(';');
    if (this.isWord('default') && this.isOp(';', 1)) {
      this.next();
      this.next();
      prop.isDefault = true;
    }
    this.skipPortability();
    return prop;
  }

  params(open = '(', close = ')') {
    this.expectOp(open);
    const groups = [];
    if (this.acceptOp(close)) return groups;
    do {
      this.skipAttributes();
      let mode = 'value';
      if (this.isKw('const') || this.isKw('var') || this.isWord('out') || this.isWord('constref')) {
        mode = this.next().lower;
        this.skipAttributes();
      }
      const names = [this.expectIdent().value];
      while (this.acceptOp(',')) names.push(this.expectIdent().value);
      let type = null;
      if (this.acceptOp(':')) {
        if (this.isKw('array')) type = this.arrayType();
        else type = this.typeRef();
      }
      if (this.acceptOp('=')) this.expression();
      groups.push({ names, type, mode });
    } while (this.acceptOp(';'));
    this.expectOp(close);
    return groups;
  }

  // ---------------------------------------------------------------- routines
  // Cabeçalho (e, quando `withBody`, corpo) de procedure/function/
  // constructor/destructor/operator. Em classes devolve `null` para cláusulas
  // de resolução de método (`procedure IFoo.Bar = Baz;`).
  routine({ withBody, inClass = false }) {
    const start = this.pos0();
    let isClass = false;
    if (this.acceptKw('class')) isClass = true;
    const kind = this.next().lower;
    const nameParts = [];
    let typeParams = [];
    do {
      nameParts.push(this.expectMemberName().value);
      if (this.isOp('<')) typeParams = this.typeParams();
    } while (this.acceptOp('.'));
    const params = this.isOp('(') ? this.params() : [];
    let returnType = null;
    if (this.acceptOp(':')) returnType = this.typeRef();
    if (inClass && this.acceptOp('=')) {
      this.qualifiedName();
      this.expectOp(';');
      return null;
    }
    this.skipPortability();
    if (!this.isKw('begin')) this.acceptOp(';');
    const directives = this.routineDirectives();
    const routine = {
      k: 'routine',
      kind,
      isClass,
      nameParts,
      name: nameParts[nameParts.length - 1],
      className: nameParts.length > 1 ? nameParts.slice(0, -1).join('.') : null,
      typeParams,
      params,
      returnType,
      directives,
      decls: [],
      body: null,
      ...start,
    };
    const noBody = directives.includes('forward') || directives.includes('external');
    if (withBody && !noBody) {
      routine.decls = this.localDeclarations();
      routine.body = this.block();
      this.expectOp(';');
    }
    return routine;
  }

  routineDirectives() {
    const directives = [];
    for (;;) {
      const t = this.peek();
      if ((t.type !== 'ident' && t.type !== 'kw') || !ROUTINE_DIRECTIVES.has(t.lower)) break;
      // `inline` e `library` são reservadas; só são diretivas aqui se não
      // começam outra coisa.
      directives.push(this.next().lower);
      while (!this.isOp(';') && !this.isKw('begin') && this.peek().type !== 'eof') {
        const u = this.peek();
        if ((u.type === 'ident' || u.type === 'kw') && ROUTINE_DIRECTIVES.has(u.lower)) break;
        this.next();
      }
      this.acceptOp(';');
    }
    return directives;
  }

  localDeclarations() {
    const decls = [];
    for (;;) {
      if (this.isOp('[')) {
        this.skipAttributes();
      } else if (this.acceptKw('type')) {
        decls.push(...this.typeSection());
      } else if (this.acceptKw('var') || this.acceptKw('threadvar')) {
        decls.push(...this.varSection());
      } else if (this.isKw('const') || this.isKw('resourcestring')) {
        this.next();
        decls.push(...this.constSection());
      } else if (this.isKw('label')) {
        this.skipUntilSemicolon();
        this.expectOp(';');
      } else if (this.isRoutineStart()) {
        decls.push(this.routine({ withBody: true }));
      } else {
        break;
      }
    }
    return decls;
  }

  block() {
    if (this.isKw('asm')) return [this.asmBlock()];
    this.expectKw('begin');
    const stmts = this.statementList(new Set(['end']));
    this.expectKw('end');
    return stmts;
  }

  asmBlock() {
    const start = this.pos0();
    this.expectKw('asm');
    while (!this.isKw('end')) {
      if (this.peek().type === 'eof') throw this.error("Esperado 'end' do bloco asm");
      this.next();
    }
    this.expectKw('end');
    return { k: 'asm', ...start };
  }

  // ---------------------------------------------------------------- instruções
  statementList(terminators) {
    const stmts = [];
    for (;;) {
      const t = this.peek();
      if (t.type === 'kw' && terminators.has(t.lower)) break;
      const stmt = this.statement();
      if (stmt) stmts.push(stmt);
      if (this.acceptOp(';')) continue;
      const after = this.peek();
      if (after.type === 'kw' && terminators.has(after.lower)) break;
      throw this.error("Esperado ';'");
    }
    return stmts;
  }

  statement() {
    const t = this.peek();
    // Rótulo: `Fim: ...`
    if ((t.type === 'ident' || t.type === 'num') && this.isOp(':', 1)) {
      this.next();
      this.next();
      return this.statement();
    }
    if (t.type === 'op' && t.value === ';') return null;
    if (t.type === 'eof') throw this.error('Instrução esperada');
    if (t.type === 'kw') {
      if (STATEMENT_END.has(t.lower)) return null;
      const start = this.pos0();
      switch (t.lower) {
        case 'begin': {
          this.next();
          const stmts = this.statementList(new Set(['end']));
          this.expectKw('end');
          return { k: 'block', stmts, ...start };
        }
        case 'if': {
          this.next();
          const cond = this.expression();
          this.expectKw('then');
          const thenStmt = this.statement();
          let elseStmt = null;
          if (this.acceptKw('else')) elseStmt = this.statement();
          return { k: 'if', cond, then: thenStmt, else: elseStmt, ...start };
        }
        case 'case':
          return this.caseStatement();
        case 'for':
          return this.forStatement();
        case 'while': {
          this.next();
          const cond = this.expression();
          this.expectKw('do');
          return { k: 'while', cond, body: this.statement(), ...start };
        }
        case 'repeat': {
          this.next();
          const body = this.statementList(new Set(['until']));
          this.expectKw('until');
          return { k: 'repeat', body, cond: this.expression(), ...start };
        }
        case 'with': {
          this.next();
          const exprs = [];
          do exprs.push(this.expression()); while (this.acceptOp(','));
          this.expectKw('do');
          return { k: 'with', exprs, body: this.statement(), ...start };
        }
        case 'try':
          return this.tryStatement();
        case 'raise': {
          this.next();
          let expr = null;
          if (!this.isOp(';') && !(this.peek().type === 'kw' && STATEMENT_END.has(this.peek().lower))) {
            expr = this.expression();
            if (this.isWord('at')) {
              this.next();
              this.expression();
            }
          }
          return { k: 'raise', expr, ...start };
        }
        case 'goto':
          this.next();
          this.next();
          return null;
        case 'asm':
          return this.asmBlock();
        case 'var':
        case 'const':
          return this.inlineVar();
        default:
          break;
      }
    }
    const start = this.pos0();
    const target = this.expression();
    if (this.acceptOp(':=')) {
      return { k: 'assign', target, value: this.expression(), ...start };
    }
    return { k: 'expr', expr: target, ...start };
  }

  inlineVar() {
    const start = this.pos0();
    this.next();
    const names = [this.expectIdent().value];
    while (this.acceptOp(',')) names.push(this.expectIdent().value);
    let type = null;
    if (this.acceptOp(':')) type = this.typeSpec();
    let value = null;
    if (this.acceptOp(':=') || this.acceptOp('=')) value = this.expression();
    return { k: 'localvar', names, type, value, ...start };
  }

  caseStatement() {
    const start = this.pos0();
    this.expectKw('case');
    const expr = this.expression();
    this.expectKw('of');
    const branches = [];
    let elseBody = null;
    for (;;) {
      if (this.isKw('end')) break;
      if (this.acceptKw('else')) {
        elseBody = this.statementList(new Set(['end']));
        break;
      }
      const labels = [];
      do {
        labels.push(this.expression());
        if (this.acceptOp('..')) this.expression();
      } while (this.acceptOp(','));
      this.expectOp(':');
      const stmt = this.statement();
      branches.push({ labels, stmt });
      if (!this.acceptOp(';')) {
        if (this.isKw('end') || this.isKw('else')) continue;
        throw this.error("Esperado ';'");
      }
    }
    this.expectKw('end');
    return { k: 'case', expr, branches, else: elseBody, ...start };
  }

  forStatement() {
    const start = this.pos0();
    this.expectKw('for');
    let declaresVar = false;
    let varType = null;
    if (this.acceptKw('var')) declaresVar = true;
    const variable = this.expectIdent().value;
    if (declaresVar && this.acceptOp(':')) varType = this.typeSpec();
    if (this.acceptKw('in')) {
      const collection = this.expression();
      this.expectKw('do');
      return { k: 'forin', variable, declaresVar, varType, collection, body: this.statement(), ...start };
    }
    this.expectOp(':=');
    const from = this.expression();
    if (!this.acceptKw('to')) this.expectKw('downto');
    const to = this.expression();
    this.expectKw('do');
    return { k: 'for', variable, declaresVar, varType, from, to, body: this.statement(), ...start };
  }

  tryStatement() {
    const start = this.pos0();
    this.expectKw('try');
    const body = this.statementList(new Set(['except', 'finally']));
    if (this.acceptKw('finally')) {
      const finallyBody = this.statementList(new Set(['end']));
      this.expectKw('end');
      return { k: 'try', body, handlers: [], exceptBody: null, finallyBody, ...start };
    }
    this.expectKw('except');
    const handlers = [];
    let exceptBody = null;
    if (this.isWord('on')) {
      while (this.isWord('on')) {
        this.next();
        let name = null;
        if (this.isIdent() && this.isOp(':', 1)) {
          name = this.next().value;
          this.next();
        }
        const type = this.typeRef();
        this.expectKw('do');
        const stmt = this.statement();
        handlers.push({ name, type, stmt });
        if (!this.acceptOp(';')) break;
      }
      if (this.acceptKw('else')) exceptBody = this.statementList(new Set(['end']));
    } else {
      exceptBody = this.statementList(new Set(['end']));
    }
    this.expectKw('end');
    return { k: 'try', body, handlers, exceptBody, finallyBody: null, ...start };
  }

  // ---------------------------------------------------------------- expressões
  expression() {
    let left = this.simpleExpression();
    for (;;) {
      const t = this.peek();
      if (t.type === 'op' && REL_OPS.has(t.value)) {
        this.next();
        left = { k: 'binop', op: t.value, left, right: this.simpleExpression() };
      } else if (t.type === 'kw' && (t.lower === 'in' || t.lower === 'is')) {
        this.next();
        left = { k: 'binop', op: t.lower, left, right: this.simpleExpression() };
      } else if (t.type === 'kw' && t.lower === 'not' && this.isKw('in', 1)) {
        // `not in` (Delphi 12)
        this.next();
        this.next();
        left = { k: 'binop', op: 'in', left, right: this.simpleExpression() };
      } else {
        return left;
      }
    }
  }

  simpleExpression() {
    let left;
    if (this.isOp('+') || this.isOp('-')) {
      const op = this.next().value;
      left = { k: 'unop', op, expr: this.term() };
    } else {
      left = this.term();
    }
    for (;;) {
      const t = this.peek();
      if ((t.type === 'op' && ADD_OPS.has(t.value)) || (t.type === 'kw' && ADD_KWS.has(t.lower))) {
        this.next();
        left = { k: 'binop', op: t.lower, left, right: this.term() };
      } else {
        return left;
      }
    }
  }

  term() {
    let left = this.factor();
    for (;;) {
      const t = this.peek();
      if ((t.type === 'op' && MUL_OPS.has(t.value)) || (t.type === 'kw' && MUL_KWS.has(t.lower))) {
        this.next();
        const right = this.factor();
        left = t.lower === 'as' ? { k: 'as', expr: left, type: right } : { k: 'binop', op: t.lower, left, right };
      } else {
        return left;
      }
    }
  }

  factor() {
    const t = this.peek();
    const start = { line: t.line, col: t.col };
    if (t.type === 'num') {
      this.next();
      return this.designatorTail({ k: 'lit', type: 'number', ...start });
    }
    if (t.type === 'str') {
      this.next();
      return this.designatorTail({ k: 'lit', type: 'string', ...start });
    }
    if (t.type === 'op') {
      switch (t.value) {
        case '@':
          this.next();
          if (this.isOp('@')) this.next();
          return { k: 'addr', expr: this.factor(), ...start };
        case '(': {
          this.next();
          const expr = this.expression();
          this.expectOp(')');
          return this.designatorTail({ k: 'paren', expr, ...start });
        }
        case '[': {
          this.next();
          const items = [];
          if (!this.isOp(']')) {
            do {
              items.push(this.expression());
              if (this.acceptOp('..')) items.push(this.expression());
            } while (this.acceptOp(','));
          }
          this.expectOp(']');
          return { k: 'set', items, ...start };
        }
        case '+':
        case '-':
          this.next();
          return { k: 'unop', op: t.value, expr: this.factor(), ...start };
        case '^':
          // `^M` (caractere de controle) — raro; tratado como literal.
          this.next();
          this.next();
          return { k: 'lit', type: 'string', ...start };
        default:
          break;
      }
    }
    if (t.type === 'kw') {
      switch (t.lower) {
        case 'not':
          this.next();
          return { k: 'unop', op: 'not', expr: this.factor(), ...start };
        case 'nil':
          this.next();
          return { k: 'lit', type: 'nil', ...start };
        case 'inherited': {
          this.next();
          let node;
          if (this.isIdent()) node = { k: 'inherited', name: this.next().value, ...start };
          else node = { k: 'inherited', name: null, ...start };
          return this.designatorTail(node);
        }
        case 'procedure':
        case 'function':
          return this.anonymousMethod();
        case 'string':
        case 'file':
          this.next();
          return this.designatorTail({ k: 'name', name: t.value, ...start });
        default:
          break;
      }
    }
    if (t.type === 'ident') {
      this.next();
      return this.designatorTail({ k: 'name', name: t.value, ...start });
    }
    throw this.error('Expressão esperada');
  }

  designatorTail(node) {
    for (;;) {
      const t = this.peek();
      if (t.type !== 'op') return node;
      if (t.value === '.') {
        if (this.isOp('.', 1)) return node;
        this.next();
        const name = this.expectMemberName();
        node = { k: 'member', obj: node, name: name.value, line: name.line, col: name.col };
      } else if (t.value === '[') {
        this.next();
        const args = [];
        do args.push(this.expression()); while (this.acceptOp(','));
        this.expectOp(']');
        node = { k: 'index', obj: node, args, line: t.line, col: t.col };
      } else if (t.value === '(') {
        this.next();
        const args = [];
        if (!this.isOp(')')) {
          do {
            args.push(this.expression());
            // Formatação de Write/Str: `X:10:2`
            while (this.acceptOp(':')) this.expression();
          } while (this.acceptOp(','));
        }
        this.expectOp(')');
        node = { k: 'call', callee: node, args, line: t.line, col: t.col };
      } else if (t.value === '^') {
        this.next();
        node = { k: 'deref', obj: node };
      } else if (t.value === '<' && this.looksLikeGenericArgs()) {
        const typeArgs = this.typeArgs();
        node = { k: 'generic', base: node, typeArgs };
      } else {
        return node;
      }
    }
  }

  // Em expressões, `<` só abre argumentos genéricos se o trecho até o `>`
  // correspondente tiver apenas nomes de tipo e for seguido de `.`, `(` etc.
  looksLikeGenericArgs() {
    let depth = 0;
    let i = this.pos;
    for (; i < this.tokens.length; i++) {
      const t = this.tokens[i];
      if (t.type === 'op' && t.value === '<') depth++;
      else if (t.type === 'op' && t.value === '>') {
        depth--;
        if (depth === 0) break;
      } else if (t.type === 'ident' || (t.type === 'kw' && t.lower === 'string')) continue;
      else if (t.type === 'op' && (t.value === ',' || t.value === '.')) continue;
      else return false;
    }
    const after = this.tokens[i + 1];
    if (!after) return false;
    if (after.type === 'op') return ['.', '(', ')', ';', ',', ']', '['].includes(after.value);
    return after.type === 'kw' && ['end', 'else', 'do', 'then', 'of', 'to', 'downto'].includes(after.lower);
  }

  anonymousMethod() {
    const start = this.pos0();
    const kind = this.next().lower;
    const params = this.isOp('(') ? this.params() : [];
    let returnType = null;
    if (this.acceptOp(':')) returnType = this.typeRef();
    const decls = this.localDeclarations();
    const body = this.block();
    return {
      k: 'anon',
      routine: {
        k: 'routine', kind, isClass: false, nameParts: [], name: null, className: null,
        typeParams: [], params, returnType, directives: [], decls, body, ...start,
      },
      ...start,
    };
  }
}
