// Lexer Delphi (design D1). Produz tokens com linha/coluna (1-based);
// comentários são descartados e strings viram um único token, de modo que
// nada dentro deles é visto como identificador. Diretivas que sobram depois
// do pré-processamento (`{$R *.dfm}`, `{$REGION}`...) são devolvidas à parte.

export const RESERVED_WORDS = new Set([
  'and', 'array', 'as', 'asm', 'begin', 'case', 'class', 'const', 'constructor',
  'destructor', 'dispinterface', 'div', 'do', 'downto', 'else', 'end', 'except',
  'exports', 'file', 'finalization', 'finally', 'for', 'function', 'goto', 'if',
  'implementation', 'in', 'inherited', 'initialization', 'inline', 'interface',
  'is', 'label', 'library', 'mod', 'nil', 'not', 'object', 'of', 'or', 'packed',
  'procedure', 'program', 'property', 'raise', 'record', 'repeat',
  'resourcestring', 'set', 'shl', 'shr', 'string', 'then', 'threadvar', 'to',
  'try', 'type', 'unit', 'until', 'uses', 'var', 'while', 'with', 'xor',
]);

const TWO_CHAR_OPS = new Set([':=', '..', '<=', '>=', '<>', '(.', '.)']);
const ONE_CHAR_OPS = new Set(['+', '-', '*', '/', '=', '<', '>', '(', ')', '[', ']', ',', ';', ':', '.', '^', '@']);

export class ParseError extends Error {
  constructor(message, line, col) {
    super(`${message} (linha ${line}, coluna ${col})`);
    this.name = 'ParseError';
    this.line = line;
    this.col = col;
  }
}

const isIdentStart = (ch) => /[A-Za-z_]/.test(ch) || ch > '\x7f';
const isIdentPart = (ch) => /[A-Za-z0-9_]/.test(ch) || ch > '\x7f';

export default function tokenize(source) {
  const tokens = [];
  const directives = [];
  const n = source.length;
  let i = 0;
  let line = 1;
  let lineStart = 0;

  const advanceTo = (end) => {
    for (let k = i; k < end; k++) {
      if (source[k] === '\n') {
        line++;
        lineStart = k + 1;
      }
    }
    i = end;
  };
  const push = (type, value, start, startLine, startCol) => {
    tokens.push({ type, value, lower: value.toLowerCase(), line: startLine, col: startCol, start });
  };

  while (i < n) {
    const ch = source[i];
    const startLine = line;
    const startCol = i - lineStart + 1;

    if (ch === '\n') {
      advanceTo(i + 1);
      continue;
    }
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\f' || ch === '\v' || ch === '﻿') {
      i++;
      continue;
    }
    // Comentários
    if (ch === '/' && source[i + 1] === '/') {
      let j = i + 2;
      while (j < n && source[j] !== '\n') j++;
      i = j;
      continue;
    }
    if (ch === '{') {
      const close = source.indexOf('}', i + 1);
      if (close === -1) throw new ParseError('Comentário { não fechado', startLine, startCol);
      if (source[i + 1] === '$') collectDirective(source.slice(i + 2, close), startLine, directives);
      advanceTo(close + 1);
      continue;
    }
    if (ch === '(' && source[i + 1] === '*') {
      const close = source.indexOf('*)', i + 2);
      if (close === -1) throw new ParseError('Comentário (* não fechado', startLine, startCol);
      if (source[i + 2] === '$') collectDirective(source.slice(i + 3, close), startLine, directives);
      advanceTo(close + 2);
      continue;
    }
    // Strings: 'abc', 'it''s', #13, #$0D e concatenações adjacentes
    if (ch === "'" || (ch === '#' && /[0-9$]/.test(source[i + 1] || ''))) {
      let j = i;
      let value = '';
      while (j < n && (source[j] === "'" || source[j] === '#')) {
        if (source[j] === "'") {
          j++;
          for (;;) {
            if (j >= n || source[j] === '\n') throw new ParseError('String não fechada', startLine, startCol);
            if (source[j] === "'") {
              if (source[j + 1] === "'") {
                value += "'";
                j += 2;
                continue;
              }
              j++;
              break;
            }
            value += source[j++];
          }
        } else {
          j++;
          const match = /^(\$[0-9A-Fa-f]+|[0-9]+)/.exec(source.slice(j, j + 12));
          if (!match) break;
          const code = match[0].startsWith('$') ? parseInt(match[0].slice(1), 16) : parseInt(match[0], 10);
          value += String.fromCharCode(code);
          j += match[0].length;
        }
      }
      push('str', value, i, startLine, startCol);
      advanceTo(j);
      continue;
    }
    // Números: 10, 1.5, 1e3, $FF, %0101
    if (/[0-9]/.test(ch) || (ch === '$' && /[0-9A-Fa-f]/.test(source[i + 1] || '')) || (ch === '%' && /[01]/.test(source[i + 1] || ''))) {
      let j = i + 1;
      if (ch === '$') while (j < n && /[0-9A-Fa-f_]/.test(source[j])) j++;
      else if (ch === '%') while (j < n && /[01_]/.test(source[j])) j++;
      else {
        while (j < n && /[0-9_]/.test(source[j])) j++;
        if (source[j] === '.' && /[0-9]/.test(source[j + 1] || '')) {
          j++;
          while (j < n && /[0-9]/.test(source[j])) j++;
        }
        if (/[eE]/.test(source[j] || '') && /[0-9+-]/.test(source[j + 1] || '')) {
          j += 2;
          while (j < n && /[0-9]/.test(source[j])) j++;
        }
      }
      push('num', source.slice(i, j), i, startLine, startCol);
      i = j;
      continue;
    }
    // Identificadores e palavras reservadas (&begin é identificador)
    if (isIdentStart(ch) || (ch === '&' && isIdentStart(source[i + 1] || ''))) {
      const escaped = ch === '&';
      let j = i + 1;
      while (j < n && isIdentPart(source[j])) j++;
      const text = source.slice(escaped ? i + 1 : i, j);
      const type = !escaped && RESERVED_WORDS.has(text.toLowerCase()) ? 'kw' : 'ident';
      push(type, text, i, startLine, startCol);
      i = j;
      continue;
    }
    const two = source.slice(i, i + 2);
    if (TWO_CHAR_OPS.has(two)) {
      push('op', two === '(.' ? '[' : two === '.)' ? ']' : two, i, startLine, startCol);
      i += 2;
      continue;
    }
    if (ONE_CHAR_OPS.has(ch)) {
      push('op', ch, i, startLine, startCol);
      i++;
      continue;
    }
    throw new ParseError(`Caractere inesperado '${ch}'`, startLine, startCol);
  }
  tokens.push({ type: 'eof', value: '', lower: '', line, col: i - lineStart + 1, start: n });
  return { tokens, directives };
}

function collectDirective(body, line, directives) {
  const match = /^\s*([A-Za-z]+)\s*(.*)$/s.exec(body);
  if (!match) return;
  directives.push({ name: match[1].toUpperCase(), arg: match[2].trim(), line });
}
