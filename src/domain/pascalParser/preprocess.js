// Pré-processador de diretivas condicionais do Delphi (ADR 0006, design D1).
// Devolve o fonte com os ramos inativos e as diretivas condicionais trocados
// por espaços, preservando quebras de linha (e, portanto, linha/coluna).

/** Símbolos considerados definidos em todo fonte (Delphi 12, Win32). */
export const DEFAULT_SYMBOLS = Object.freeze([
  'MSWINDOWS',
  'WIN32',
  'CPUX86',
  'CPU386',
  'CPU32BITS',
  'ASSEMBLER',
  'CONDITIONALEXPRESSIONS',
  'UNICODE',
  'DCC',
  'NATIVECODE',
  'VER360',
]);

// Constantes usadas em `{$IF CompilerVersion >= N}`.
const CONSTANTS = { compilerversion: 36, rtlversion: 36, true: 1, false: 0 };

const CONDITIONALS = new Set([
  'IFDEF', 'IFNDEF', 'IF', 'IFOPT', 'ELSEIF', 'ELSE', 'ENDIF', 'IFEND', 'DEFINE', 'UNDEF',
]);

export default function preprocess(source, { symbols = DEFAULT_SYMBOLS } = {}) {
  const defined = new Set(symbols.map((s) => s.toUpperCase()));
  const out = source.split('');
  const stack = []; // { parentActive, active, taken }
  const isActive = () => stack.length === 0 || stack[stack.length - 1].active;

  const blank = (from, to) => {
    for (let k = from; k < to; k++) if (out[k] !== '\n' && out[k] !== '\r') out[k] = ' ';
  };

  let i = 0;
  let inactiveFrom = null; // início do trecho inativo ainda não apagado
  const n = source.length;

  const handleDirective = (start, end, body) => {
    const match = /^\s*([A-Za-z]+)\s*(.*)$/s.exec(body);
    const name = match ? match[1].toUpperCase() : '';
    const arg = match ? match[2].trim() : '';
    if (!CONDITIONALS.has(name)) return; // outras diretivas ficam como estão
    blank(start, end);
    const parentActive = isActive();
    switch (name) {
      case 'IFDEF':
      case 'IFNDEF':
      case 'IF':
      case 'IFOPT': {
        let cond = false;
        if (parentActive) {
          if (name === 'IFDEF') cond = defined.has(firstWord(arg));
          else if (name === 'IFNDEF') cond = !defined.has(firstWord(arg));
          else if (name === 'IF') cond = evaluate(arg, defined);
        }
        const active = parentActive && cond;
        stack.push({ parentActive, active, taken: active });
        break;
      }
      case 'ELSEIF': {
        const top = stack[stack.length - 1];
        if (!top) break;
        const cond = top.parentActive && !top.taken && evaluate(arg, defined);
        top.active = cond;
        top.taken = top.taken || cond;
        break;
      }
      case 'ELSE': {
        const top = stack[stack.length - 1];
        if (!top) break;
        top.active = top.parentActive && !top.taken;
        top.taken = true;
        break;
      }
      case 'ENDIF':
      case 'IFEND':
        stack.pop();
        break;
      case 'DEFINE':
        if (parentActive) defined.add(firstWord(arg));
        break;
      case 'UNDEF':
        if (parentActive) defined.delete(firstWord(arg));
        break;
      default:
        break;
    }
  };

  while (i < n) {
    const ch = source[i];
    const wasActive = isActive();
    let tokenEnd = i + 1;

    if (ch === "'") {
      let j = i + 1;
      while (j < n && source[j] !== "'" && source[j] !== '\n') j++;
      tokenEnd = Math.min(j + 1, n);
    } else if (ch === '/' && source[i + 1] === '/') {
      let j = i + 2;
      while (j < n && source[j] !== '\n') j++;
      tokenEnd = j;
    } else if (ch === '{') {
      const close = source.indexOf('}', i + 1);
      tokenEnd = close === -1 ? n : close + 1;
      if (source[i + 1] === '$') {
        if (inactiveFrom !== null) blank(inactiveFrom, i);
        inactiveFrom = null;
        handleDirective(i, tokenEnd, source.slice(i + 2, tokenEnd - 1));
        i = tokenEnd;
        if (!isActive()) inactiveFrom = i;
        continue;
      }
    } else if (ch === '(' && source[i + 1] === '*') {
      const close = source.indexOf('*)', i + 2);
      tokenEnd = close === -1 ? n : close + 2;
      if (source[i + 2] === '$') {
        if (inactiveFrom !== null) blank(inactiveFrom, i);
        inactiveFrom = null;
        handleDirective(i, tokenEnd, source.slice(i + 3, tokenEnd - 2));
        i = tokenEnd;
        if (!isActive()) inactiveFrom = i;
        continue;
      }
    }

    if (!wasActive && inactiveFrom === null) inactiveFrom = i;
    i = tokenEnd;
  }
  if (inactiveFrom !== null) blank(inactiveFrom, n);
  return out.join('');
}

function firstWord(text) {
  const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(text);
  return match ? match[0].toUpperCase() : '';
}

// Avalia a expressão de `{$IF ...}`/`{$ELSEIF ...}`: Defined(X), Declared(X)
// (sempre falso), not/and/or, parênteses, números, comparações e as
// constantes conhecidas. Qualquer outra coisa conta como 0/falso.
export function evaluate(expression, defined) {
  const tokens = expression.match(/[A-Za-z_][A-Za-z0-9_.]*|\d+(?:\.\d+)?|<>|<=|>=|[()<>=]/g) || [];
  let pos = 0;
  const peek = () => (tokens[pos] || '').toLowerCase();
  const next = () => tokens[pos++] || '';

  const primary = () => {
    const token = next();
    const lower = token.toLowerCase();
    if (lower === 'not') return primary() ? 0 : 1;
    if (token === '(') {
      const value = orExpr();
      if (peek() === ')') pos++;
      return value;
    }
    if (lower === 'defined' || lower === 'declared') {
      let name = '';
      if (peek() === '(') {
        pos++;
        name = next();
        if (peek() === ')') pos++;
      }
      return lower === 'defined' && defined.has(name.toUpperCase()) ? 1 : 0;
    }
    if (/^\d/.test(token)) return Number(token);
    return CONSTANTS[lower] ?? 0;
  };
  const comparison = () => {
    const left = primary();
    const op = peek();
    if (!['=', '<>', '<', '>', '<=', '>='].includes(op)) return left;
    pos++;
    const right = primary();
    switch (op) {
      case '=': return left === right ? 1 : 0;
      case '<>': return left !== right ? 1 : 0;
      case '<': return left < right ? 1 : 0;
      case '>': return left > right ? 1 : 0;
      case '<=': return left <= right ? 1 : 0;
      default: return left >= right ? 1 : 0;
    }
  };
  const andExpr = () => {
    let value = comparison();
    while (peek() === 'and') {
      pos++;
      const right = comparison();
      value = value && right ? 1 : 0;
    }
    return value;
  };
  const orExpr = () => {
    let value = andExpr();
    while (peek() === 'or') {
      pos++;
      const right = andExpr();
      value = value || right ? 1 : 0;
    }
    return value;
  };
  return Boolean(orExpr());
}
