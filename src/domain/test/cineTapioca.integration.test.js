// Projeto real (fixtures/cineTapioca, ver README da pasta). Os Callers
// esperados foram conferidos à mão no fonte.
import expandCallerGraph from '../expandCallerGraph/index.js';
import { indexFixture } from './support/fixtureProject.js';
import { edgeList, idOf, nodeList } from './support/graphView.js';

let index;
beforeAll(async () => {
  ({ index } = await indexFixture('cineTapioca', 'CineTapioca.dpr'));
});
const graphOf = (label) => expandCallerGraph(index, idOf(index, label));

test('todas as Units são analisadas', () => {
  expect(index.skippedUnits).toEqual([]);
  expect(index.units).toHaveLength(14);
  expect(index.projectName).toBe('CineTapioca');
});

test('Method chamado pelo bloco principal do .dpr', () => {
  const graph = graphOf('TdmConn.Conecta');
  expect(nodeList(graph)).toEqual(['TdmConn.Conecta [target]', 'Programa [entry]']);
  expect(edgeList(graph)).toEqual(['Programa → TdmConn.Conecta']);
  expect(graph.nodes[1]).toMatchObject({ id: 'program:cinetapioca', kind: 'program', unitName: 'CineTapioca' });
  expect(graph.skippedUnits).toEqual([]);
});

test('handler ligado no .dfm de um formulário herdado de uCadastroBase', () => {
  const graph = graphOf('TfmCadastroSessoes.btSalasRefreshClick');
  expect(nodeList(graph)).toEqual(['TfmCadastroSessoes.btSalasRefreshClick [target] [entry]']);
  expect(graph.edges).toEqual([]);
});

test('handler de uCadastroBase alcançado por inherited a partir do formulário filho', () => {
  const graph = graphOf('TfmCadastroBase.FormShow');
  // OnShow = FormShow está no uCadastroBase.dfm; no formulário herdado o
  // mesmo handler resolve para TfmCadastroSessoes.FormShow, que chama
  // `inherited`.
  expect(nodeList(graph)).toEqual(['TfmCadastroBase.FormShow [target] [entry]', 'TfmCadastroSessoes.FormShow [entry]']);
  expect(edgeList(graph)).toEqual(['TfmCadastroSessoes.FormShow → TfmCadastroBase.FormShow']);
});

test('override de ValidarDados alcançado polimorficamente por TfmCadastroBase.Save', () => {
  const graph = graphOf('TfmCadastroSessoes.ValidarDados');
  expect(nodeList(graph)).toEqual([
    'TfmCadastroSessoes.ValidarDados [target]',
    'TfmCadastroBase.Save',
    'TfmCadastroBase.FormKeyDown [entry]',
    'TfmCadastroBase.btSalvarClick [entry]',
  ]);
  expect(edgeList(graph)).toEqual([
    'TfmCadastroBase.Save → TfmCadastroSessoes.ValidarDados (via TfmCadastroBase.ValidarDados)',
    'TfmCadastroBase.FormKeyDown → TfmCadastroBase.Save',
    'TfmCadastroBase.btSalvarClick → TfmCadastroBase.Save',
  ]);
  expect(graph.edges[0]).toMatchObject({ isPolymorphic: true, viaId: 'unit:ucadastrobase|tfmcadastrobase|validardados' });
});

test('routine solta de uSystemUtils chamada de várias Units', () => {
  const graph = graphOf('Criptografar');
  expect(edgeList(graph)).toEqual([
    'TfmCadastroUsuarios.qrDadosAfterScroll → Criptografar',
    'TfmCadastroUsuarios.qrDadosBeforePost → Criptografar',
    'TfmDialogoLogin.btOkClick → Criptografar',
  ]);
  expect(graph.nodes.filter((n) => n.isEntryPoint).map((n) => n.label)).toEqual([
    'TfmCadastroUsuarios.qrDadosAfterScroll',
    'TfmCadastroUsuarios.qrDadosBeforePost',
    'TfmDialogoLogin.btOkClick',
  ]);
});
