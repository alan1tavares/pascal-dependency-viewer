import expandCallerGraph, { MethodNotFoundError } from '../expandCallerGraph/index.js';

const id = (label) => `unit:u||${label.toLowerCase()}`;

// Índice montado à mão: `calls` = [caller, callee, via?] (via ⇒ polimórfica).
function makeIndex({ methods = [], calls = [], entryPoints = [], blocks = [], skippedUnits = [] }) {
  const nodes = new Map();
  for (const label of methods) nodes.set(id(label), { id: id(label), label, unitName: 'U', kind: 'method' });
  for (const block of blocks) nodes.set(block.id, block);
  const resolve = (label) => (nodes.has(label) ? label : id(label));
  const callers = new Map();
  for (const [caller, callee, via] of calls) {
    const key = resolve(callee);
    if (!callers.has(key)) callers.set(key, []);
    callers.get(key).push(via
      ? { callerId: resolve(caller), kind: 'polymorphic', viaId: id(via), viaLabel: via }
      : { callerId: resolve(caller), kind: 'direct' });
  }
  return { nodes, callers, entryPoints: new Set(entryPoints.map(resolve)), skippedUnits, units: [], projectName: 'P' };
}

const labels = (graph) => graph.nodes.map((n) => n.label);
const arrows = (graph) => graph.edges.map((e) => `${e.from.split('|').pop()}→${e.to.split('|').pop()}${e.isBackEdge ? ' (back)' : ''}`);

describe('Expansão transitiva', () => {
  test('cadeia simples', () => {
    const graph = expandCallerGraph(makeIndex({ methods: ['T', 'A', 'B'], calls: [['A', 'T'], ['B', 'A']] }), id('T'));
    expect(labels(graph)).toEqual(['T', 'A', 'B']);
    expect(arrows(graph)).toEqual(['a→t', 'b→a']);
  });

  test('diamante: o Caller comum aparece uma única vez', () => {
    const graph = expandCallerGraph(makeIndex({
      methods: ['T', 'A', 'B', 'D'],
      calls: [['A', 'T'], ['B', 'T'], ['D', 'A'], ['D', 'B']],
    }), id('T'));
    expect(labels(graph)).toEqual(['T', 'A', 'D', 'B']);
    expect(arrows(graph)).toEqual(['a→t', 'd→a', 'b→t', 'd→b']);
    expect(graph.edges.every((e) => !e.isBackEdge)).toBe(true);
  });

  test('Target Method sem Callers', () => {
    const graph = expandCallerGraph(makeIndex({ methods: ['T', 'X'], calls: [['T', 'X']] }), id('T'));
    expect(labels(graph)).toEqual(['T']);
    expect(graph.edges).toEqual([]);
  });

  test('cadeia longa não estoura a pilha', () => {
    const methods = Array.from({ length: 20000 }, (_, i) => `M${i}`);
    const calls = methods.slice(1).map((m, i) => [m, methods[i]]);
    const graph = expandCallerGraph(makeIndex({ methods, calls }), id('M0'));
    expect(graph.nodes).toHaveLength(20000);
  });
});

describe('Formato dos nós', () => {
  test('marcações do Target Method e de um handler', () => {
    const graph = expandCallerGraph(makeIndex({
      methods: ['TCliente.Salvar', 'TForm1.Button1Click'],
      calls: [['TForm1.Button1Click', 'TCliente.Salvar']],
      entryPoints: ['TForm1.Button1Click'],
    }), id('TCliente.Salvar'));
    expect(graph.nodes).toEqual([
      { id: id('TCliente.Salvar'), label: 'TCliente.Salvar', unitName: 'U', kind: 'method', isTarget: true, isEntryPoint: false },
      { id: id('TForm1.Button1Click'), label: 'TForm1.Button1Click', unitName: 'U', kind: 'method', isTarget: false, isEntryPoint: true },
    ]);
  });

  test('bloco principal', () => {
    const program = { id: 'program:projeto', label: 'Programa', unitName: 'Projeto', kind: 'program' };
    const graph = expandCallerGraph(makeIndex({
      methods: ['Inicializar'],
      blocks: [program],
      calls: [['program:projeto', 'Inicializar']],
      entryPoints: ['program:projeto'],
    }), id('Inicializar'));
    expect(graph.nodes[1]).toEqual({ ...program, isTarget: false, isEntryPoint: true });
  });
});

describe('Formato das arestas', () => {
  test('aresta polimórfica com via, sem nó para o Method via', () => {
    const graph = expandCallerGraph(makeIndex({
      methods: ['TDerived.Salvar', 'TBase.Salvar', 'X'],
      calls: [['X', 'TBase.Salvar'], ['X', 'TDerived.Salvar', 'TBase.Salvar']],
    }), id('TDerived.Salvar'));
    expect(graph.edges).toEqual([
      { from: id('X'), to: id('TDerived.Salvar'), isBackEdge: false, isPolymorphic: true, viaId: id('TBase.Salvar'), viaLabel: 'TBase.Salvar' },
    ]);
    expect(labels(graph)).toEqual(['TDerived.Salvar', 'X']);
  });

  test('chamada direta e polimórfica do mesmo Caller viram uma aresta direta', () => {
    for (const calls of [
      [['X', 'TDerived.Salvar'], ['X', 'TDerived.Salvar', 'TBase.Salvar']],
      [['X', 'TDerived.Salvar', 'TBase.Salvar'], ['X', 'TDerived.Salvar']],
    ]) {
      const graph = expandCallerGraph(makeIndex({ methods: ['TDerived.Salvar', 'X'], calls }), id('TDerived.Salvar'));
      expect(graph.edges).toEqual([{ from: id('X'), to: id('TDerived.Salvar'), isBackEdge: false, isPolymorphic: false }]);
    }
  });

  test('aresta direta não tem viaId nem viaLabel', () => {
    const graph = expandCallerGraph(makeIndex({ methods: ['T', 'A'], calls: [['A', 'T']] }), id('T'));
    expect(Object.keys(graph.edges[0]).sort()).toEqual(['from', 'isBackEdge', 'isPolymorphic', 'to']);
  });
});

describe('Recursão e ciclos', () => {
  test('recursão direta vira self-loop sem back-edge', () => {
    const graph = expandCallerGraph(makeIndex({ methods: ['Fatorial', 'Main'], calls: [['Fatorial', 'Fatorial'], ['Main', 'Fatorial']] }), id('Fatorial'));
    expect(graph.edges).toEqual([
      { from: id('Fatorial'), to: id('Fatorial'), isBackEdge: false, isPolymorphic: false },
      { from: id('Main'), to: id('Fatorial'), isBackEdge: false, isPolymorphic: false },
    ]);
    expect(labels(graph)).toEqual(['Fatorial', 'Main']);
  });

  test('ciclo mútuo', () => {
    const graph = expandCallerGraph(makeIndex({ methods: ['T', 'A'], calls: [['A', 'T'], ['T', 'A']] }), id('T'));
    expect(arrows(graph)).toEqual(['a→t', 't→a (back)']);
  });

  test('nó já visitado fora da pilha não gera back-edge', () => {
    // T ← A ← C e T ← B ← C: C → B chega a C já fechado, sem ciclo.
    const graph = expandCallerGraph(makeIndex({
      methods: ['T', 'A', 'B', 'C'],
      calls: [['A', 'T'], ['B', 'T'], ['C', 'A'], ['C', 'B'], ['A', 'C']],
    }), id('T'));
    expect(arrows(graph)).toEqual(['a→t', 'c→a', 'a→c (back)', 'b→t', 'c→b']);
  });

  test('resultado determinístico', () => {
    const index = makeIndex({
      methods: ['T', 'A', 'B', 'C'],
      calls: [['A', 'T'], ['B', 'T'], ['C', 'A'], ['T', 'C'], ['B', 'B']],
    });
    expect(expandCallerGraph(index, id('T'))).toEqual(expandCallerGraph(index, id('T')));
    expect(JSON.stringify(expandCallerGraph(index, id('T')))).toBe(JSON.stringify(expandCallerGraph(index, id('T'))));
  });
});

test('skippedUnits lista todas as Units não analisadas', () => {
  const skippedUnits = [{ unitName: 'UQuebrada', reason: 'erro (linha 1, coluna 1)' }];
  const graph = expandCallerGraph(makeIndex({ methods: ['T'], skippedUnits }), id('T'));
  expect(graph.skippedUnits).toEqual(skippedUnits);
});

test('id inexistente ou de bloco falha com METHOD_NOT_FOUND', () => {
  const index = makeIndex({ methods: ['T'], blocks: [{ id: 'program:p', label: 'Programa', unitName: 'P', kind: 'program' }] });
  expect(() => expandCallerGraph(index, 'unit:u||nada')).toThrow(MethodNotFoundError);
  expect(() => expandCallerGraph(index, 'program:p')).toThrow(expect.objectContaining({ code: 'METHOD_NOT_FOUND' }));
});
