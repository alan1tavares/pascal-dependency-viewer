import tokenize from '../pascalParser/lexer.js';

const values = (source) => tokenize(source).tokens.filter((t) => t.type !== 'eof').map((t) => t.value);
const idents = (source) => tokenize(source).tokens.filter((t) => t.type === 'ident').map((t) => t.lower);

test('chamada dentro de comentário ou string é ignorada', () => {
  const source = "begin\n  // Salvar;\n  { Salvar; }\n  (* Salvar; *)\n  ShowMessage('Salvar');\nend;";
  expect(idents(source)).toEqual(['showmessage']);
  const str = tokenize(source).tokens.find((t) => t.type === 'str');
  expect(str.value).toBe('Salvar');
});

test('palavras reservadas são case-insensitive e identificadores guardam a grafia', () => {
  const { tokens } = tokenize('BEGIN Foo.Bar End');
  expect(tokens.map((t) => [t.type, t.lower])).toEqual([
    ['kw', 'begin'], ['ident', 'foo'], ['op', '.'], ['ident', 'bar'], ['kw', 'end'], ['eof', ''],
  ]);
  expect(tokens[1].value).toBe('Foo');
});

test('linha e coluna de cada token', () => {
  const { tokens } = tokenize('a :=\n  b;');
  expect(tokens.slice(0, 4).map((t) => [t.value, t.line, t.col])).toEqual([
    ['a', 1, 1], [':=', 1, 3], ['b', 2, 3], [';', 2, 4],
  ]);
});

test("strings com aspas duplicadas, #13 e #$0D", () => {
  const { tokens } = tokenize("S := 'it''s'#13#$0A'x';");
  const str = tokens.find((t) => t.type === 'str');
  expect(str.value).toBe("it's\r\nx");
  expect(tokens.filter((t) => t.type === 'str')).toHaveLength(1);
});

test('números decimais, reais, hexadecimais e faixas', () => {
  expect(values('X := $FF + 1.5e3 + 10; A: array[0..4] of Integer;')).toEqual([
    'X', ':=', '$FF', '+', '1.5e3', '+', '10', ';', 'A', ':', 'array', '[', '0', '..', '4', ']', 'of', 'Integer', ';',
  ]);
});

test('operadores de dois caracteres', () => {
  expect(values('a <> b; c <= d; e >= f; @g; h^')).toEqual([
    'a', '<>', 'b', ';', 'c', '<=', 'd', ';', 'e', '>=', 'f', ';', '@', 'g', ';', 'h', '^',
  ]);
});

test('identificador escapado com & e caracteres acentuados', () => {
  expect(idents('&Type := Ação;')).toEqual(['type', 'ação']);
});

test('diretivas restantes são coletadas à parte', () => {
  const { directives, tokens } = tokenize('implementation\n{$R *.dfm}\n{$REGION \'x\'}\nend.');
  expect(directives).toEqual([
    { name: 'R', arg: '*.dfm', line: 2 },
    { name: 'REGION', arg: "'x'", line: 3 },
  ]);
  expect(tokens.map((t) => t.value)).toEqual(['implementation', 'end', '.', '']);
});

test('string não fechada gera erro com linha e coluna', () => {
  expect(() => tokenize("x := 'abc\n;")).toThrow(/linha 1, coluna 6/);
});
