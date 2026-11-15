import { assignCallerLevels } from '../callerLevels/index.js';

const graph = (ids, edges) => ({
  nodes: ids.map((id) => ({ id, isTarget: id === ids[0] })),
  edges: edges.map(([from, to, back = false]) => ({ from, to, isBackEdge: back, isPolymorphic: false })),
});
const asObject = (levels) => Object.fromEntries(levels);

test('cadeia simples', () => {
  expect(asObject(assignCallerLevels(graph(['T', 'A', 'B'], [['A', 'T'], ['B', 'A']])))).toEqual({ T: 0, A: 1, B: 2 });
});

test('ramificação', () => {
  const levels = assignCallerLevels(graph(['Validar', 'A', 'B', 'C'], [['A', 'Validar'], ['B', 'Validar'], ['C', 'A']]));
  expect(asObject(levels)).toEqual({ Validar: 0, A: 1, B: 1, C: 2 });
});

test('Caller fica acima de todos os Methods que chama (caminho mais longo)', () => {
  // D chama T diretamente e também A, que chama T.
  const levels = assignCallerLevels(graph(['T', 'A', 'D'], [['A', 'T'], ['D', 'T'], ['D', 'A']]));
  expect(asObject(levels)).toEqual({ T: 0, A: 1, D: 2 });
});

test('auto-recursão não muda o nível', () => {
  const levels = assignCallerLevels(graph(['Fatorial', 'Main'], [['Fatorial', 'Fatorial'], ['Main', 'Fatorial']]));
  expect(asObject(levels)).toEqual({ Fatorial: 0, Main: 1 });
});

test('ciclo mútuo: a back-edge é ignorada', () => {
  const levels = assignCallerLevels(graph(['A', 'B'], [['B', 'A'], ['A', 'B', true]]));
  expect(asObject(levels)).toEqual({ A: 0, B: 1 });
});

test('Target Method sozinho', () => {
  expect(asObject(assignCallerLevels(graph(['T'], [])))).toEqual({ T: 0 });
});
