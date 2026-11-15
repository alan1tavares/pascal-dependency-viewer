import { indexFixture } from './support/fixtureProject.js';
import { callersOf, isEntryPoint } from './support/memoryProject.js';

let index;
let read;
let projectUnits;

beforeAll(async () => {
  ({ index, read, projectUnits } = await indexFixture('callGraph', 'CallGraph.dpr'));
});

describe('Índice de chamadas do Project', () => {
  test('chamada direta entre Units', () => {
    expect(callersOf(index, 'TPedido.Salvar')).toEqual(['TServico.Exportar', 'TFormPrincipal.Button1Click']);
  });

  test('chamada dentro de rotina aninhada é do Method envolvente', () => {
    expect(callersOf(index, 'TRepositorio.Primeiro')).toEqual(['TServico.Processar']);
    expect([...index.nodes.values()].some((node) => node.label === 'Interna')).toBe(false);
  });

  test('chamada no bloco principal do Project', () => {
    expect(callersOf(index, 'Inicializar')).toEqual(['Programa']);
    expect(index.nodes.get('program:callgraph')).toEqual({
      id: 'program:callgraph', label: 'Programa', unitName: 'CallGraph', kind: 'program',
    });
  });

  test('chamada em initialization', () => {
    expect(callersOf(index, 'RegistrarClasses')).toEqual(['UServicos (initialization)']);
    expect(index.nodes.get('init:uservicos')).toMatchObject({ kind: 'initialization', unitName: 'UServicos' });
  });

  test('{$IFDEF} com símbolo padrão: só o ramo ativo gera chamadas', () => {
    expect(callersOf(index, 'TCliente.Gravar')).toEqual(['TServico.Processar', 'TServico.ComWith']);
  });

  test('recursão direta e ciclo mútuo ficam registrados', () => {
    expect(callersOf(index, 'Fatorial')).toEqual(['Fatorial', 'TServico.ComWith', 'Inicializar']);
    expect(callersOf(index, 'Ping')).toEqual(['Pong', 'TFormLegado.FormShow']);
    expect(callersOf(index, 'Pong')).toEqual(['Ping']);
  });

  test('Polymorphic Calls por virtual, por interface e por genérico com constraint', () => {
    expect(callersOf(index, 'TCliente.Salvar')).toEqual([
      'TCliente.Gravar',
      'TPedido.Salvar',
      'TRepositorio.SalvarTodos (via TEntidade.Salvar)',
      'TServico.Processar',
      'TServico.Exportar (via ISalvavel.Salvar)',
    ]);
    expect(callersOf(index, 'TCliente.Validar')).toEqual(['TEntidade.Salvar (via TEntidade.Validar)', 'TServico.Exportar']);
  });

  test('Unit inválida é pulada com motivo e o resto do Project é analisado', () => {
    expect(index.skippedUnits).toEqual([
      { unitName: 'UQuebrada', reason: expect.stringMatching(/linha 9, coluna 6/) },
    ]);
    expect(index.units.find((u) => u.unitName === 'UQuebrada')).toMatchObject({ methods: [], skipped: expect.any(String) });
    expect(index.units.filter((u) => !u.skipped)).toHaveLength(6);
  });

  test('External Units nunca são lidas', () => {
    const projectFiles = new Set(projectUnits.map((u) => u.path));
    for (const file of read) {
      expect(file === 'CallGraph.dpr' || projectFiles.has(file) || /\.(dfm|fmx)$/.test(file)).toBe(true);
    }
    expect(read.some((file) => /Vcl|System|Generics/i.test(file))).toBe(false);
  });
});

describe('Handlers de formulário', () => {
  test('handler ligado no .dfm texto é Entry Point', () => {
    expect(isEntryPoint(index, 'TFormPrincipal.Button1Click')).toBe(true);
    expect(isEntryPoint(index, 'TFormPrincipal.FormCreate')).toBe(true);
  });

  test('.dfm binário não marca Entry Point e a Unit continua analisada', () => {
    expect(isEntryPoint(index, 'TFormLegado.FormShow')).toBe(false);
    expect(callersOf(index, 'Ping')).toContain('TFormLegado.FormShow');
  });

  test('handler atribuído em código é Entry Point, sem Caller', () => {
    expect(isEntryPoint(index, 'TFormPrincipal.Button2Click')).toBe(true);
    expect(callersOf(index, 'TFormPrincipal.Button2Click')).toEqual([]);
  });
});

describe('Blocos especiais', () => {
  test('bloco principal e initialization são sempre Entry Points', () => {
    expect(index.entryPoints.has('program:callgraph')).toBe(true);
    expect(index.entryPoints.has('init:uservicos')).toBe(true);
  });

  test('Entry Point que também é chamado', () => {
    expect(isEntryPoint(index, 'TFormPrincipal.Button1Click')).toBe(true);
    expect(callersOf(index, 'TFormPrincipal.Button1Click')).toEqual(['TFormPrincipal.Atalho']);
  });
});

test('cede o event loop durante a montagem', async () => {
  let ticks = 0;
  const timer = setInterval(() => ticks++, 0);
  await indexFixture('callGraph', 'CallGraph.dpr');
  clearInterval(timer);
  expect(ticks).toBeGreaterThan(0);
});
