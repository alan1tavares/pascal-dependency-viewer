import preprocess, { evaluate, DEFAULT_SYMBOLS } from '../pascalParser/preprocess.js';

const words = (text) => preprocess(text).split(/\s+/).filter(Boolean);

test('ramo com símbolo padrão é mantido', () => {
  expect(words('{$IFDEF MSWINDOWS} A; {$ELSE} B; {$ENDIF}')).toEqual(['A;']);
});

test('ramo com símbolo desconhecido é descartado', () => {
  expect(words('X; {$IFDEF DEBUG_LOG} Log; {$ENDIF} Y;')).toEqual(['X;', 'Y;']);
});

test('DEFINE no próprio arquivo ativa o ramo seguinte', () => {
  expect(words('{$DEFINE USE_CACHE} {$IFDEF USE_CACHE} Cache; {$ENDIF}')).toEqual(['Cache;']);
});

test('UNDEF desliga um símbolo padrão', () => {
  expect(words('{$UNDEF MSWINDOWS} {$IFDEF MSWINDOWS} A; {$ELSE} B; {$ENDIF}')).toEqual(['B;']);
});

test('diretivas aninhadas: bloco externo inativo descarta o interno', () => {
  const source = '{$IFDEF X} A; {$IFDEF MSWINDOWS} B; {$ELSE} C; {$ENDIF} D; {$ELSE} E; {$ENDIF}';
  expect(words(source)).toEqual(['E;']);
});

test('IFNDEF, IF Defined e ELSEIF', () => {
  expect(words('{$IFNDEF DEBUG} A; {$ENDIF}')).toEqual(['A;']);
  expect(words('{$IF Defined(X)} A; {$ELSEIF Defined(WIN32) and not Defined(Y)} B; {$ELSE} C; {$IFEND}')).toEqual(['B;']);
  expect(words('{$IF CompilerVersion >= 20} A; {$ENDIF}')).toEqual(['A;']);
});

test('forma (*$...*) também é reconhecida', () => {
  expect(words('(*$IFDEF NADA*) A; (*$ELSE*) B; (*$ENDIF*)')).toEqual(['B;']);
});

test('diretivas que não são condicionais ficam no fonte', () => {
  expect(preprocess('{$R *.dfm} X;')).toBe('{$R *.dfm} X;');
});

test('preserva linhas e colunas', () => {
  const source = 'a;\n{$IFDEF NADA}\nb;\n{$ENDIF}\nc;';
  const result = preprocess(source);
  expect(result.length).toBe(source.length);
  expect(result.split('\n')).toHaveLength(5);
  expect(result.split('\n')[4]).toBe('c;');
  expect(result.split('\n')[2].trim()).toBe('');
});

test('{$ dentro de string ou comentário não é diretiva', () => {
  expect(words("S := '{$IFDEF NADA}'; // {$IFDEF NADA}\nX;")).toEqual(["S", ":=", "'{$IFDEF", "NADA}';", '//', '{$IFDEF', 'NADA}', 'X;']);
});

test('conjunto padrão contém os símbolos mínimos do spec', () => {
  for (const symbol of ['MSWINDOWS', 'WIN32', 'CONDITIONALEXPRESSIONS', 'UNICODE', 'DCC']) {
    expect(DEFAULT_SYMBOLS).toContain(symbol);
  }
  expect(evaluate('Defined(MSWINDOWS) or Defined(NADA)', new Set(['MSWINDOWS']))).toBe(true);
});
