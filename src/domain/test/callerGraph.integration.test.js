import expandCallerGraph from '../expandCallerGraph/index.js';
import { indexFixture } from './support/fixtureProject.js';
import { edgeList, idOf, nodeList } from './support/graphView.js';

let index;
beforeAll(async () => {
  ({ index } = await indexFixture('callGraph', 'CallGraph.dpr'));
});
const graphOf = (label) => expandCallerGraph(index, idOf(index, label));

test('cadeia que sobe até um handler de .dfm', () => {
  const graph = graphOf('TPedido.Salvar');
  expect(nodeList(graph)).toEqual([
    'TPedido.Salvar [target]',
    'TServico.Exportar',
    'TFormPrincipal.Button1Click [entry]',
    'TFormPrincipal.Atalho',
  ]);
  expect(edgeList(graph)).toEqual([
    'TServico.Exportar → TPedido.Salvar',
    'TFormPrincipal.Button1Click → TPedido.Salvar',
    'TFormPrincipal.Atalho → TFormPrincipal.Button1Click',
  ]);
  expect(graph.skippedUnits).toEqual([{ unitName: 'UQuebrada', reason: expect.stringContaining('linha 9') }]);
});

test('recursão direta até o bloco principal', () => {
  const graph = graphOf('Fatorial');
  expect(nodeList(graph)).toEqual(['Fatorial [target]', 'TServico.ComWith', 'Inicializar', 'Programa [entry]']);
  expect(edgeList(graph)).toEqual([
    'Fatorial → Fatorial',
    'TServico.ComWith → Fatorial',
    'Inicializar → Fatorial',
    'Programa → Inicializar',
  ]);
  expect(graph.edges[0].isBackEdge).toBe(false);
});

test('ciclo mútuo fecha com back-edge', () => {
  const graph = graphOf('Ping');
  expect(nodeList(graph)).toEqual(['Ping [target]', 'Pong', 'TFormLegado.FormShow']);
  expect(edgeList(graph)).toEqual([
    'Pong → Ping',
    'Ping → Pong [back]',
    'TFormLegado.FormShow → Ping',
  ]);
});

test('Polymorphic Calls chegam como arestas marcadas, sem nó do Method via', () => {
  const graph = graphOf('TCliente.Validar');
  expect(edgeList(graph)).toContain('TEntidade.Salvar → TCliente.Validar (via TEntidade.Validar)');
  expect(nodeList(graph)).not.toContain('TEntidade.Validar');
});
