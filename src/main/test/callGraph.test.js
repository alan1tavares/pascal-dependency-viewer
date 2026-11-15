import { createCallIndexCache } from '../services/callIndexCache.js';
import { registerCallGraphHandler } from '../ipc/callGraph.js';
import { indexFixture } from '../../domain/test/support/fixtureProject.js';

let fixtureIndex;
beforeAll(async () => {
  ({ index: fixtureIndex } = await indexFixture('callGraph', 'CallGraph.dpr'));
});

// Handlers registrados num ipcMain falso, sobre um cache cujo `build`
// devolve o índice da fixture `callGraph` (contando as montagens).
function setup({ withProject = true } = {}) {
  let builds = 0;
  const cache = createCallIndexCache({
    build: async () => {
      builds++;
      return fixtureIndex;
    },
  });
  if (withProject) cache.setProject({ dprPath: '/p/CallGraph.dpr', projectDir: '/p', projectUnits: [] });
  const handlers = {};
  registerCallGraphHandler({ handle: (channel, fn) => { handlers[channel] = fn; } }, { cache });
  return { handlers, builds: () => builds };
}

describe('methods:list', () => {
  test('lista os Methods da Unit na ordem do fonte, com id e label', async () => {
    const { handlers } = setup();
    const result = await handlers['methods:list']({}, 'UServicos');
    expect(result).toEqual({
      methods: [
        { id: 'unit:uservicos|tservico|processar', label: 'TServico.Processar' },
        { id: 'unit:uservicos|tservico|exportar', label: 'TServico.Exportar' },
        { id: 'unit:uservicos|tservico|comwith', label: 'TServico.ComWith' },
        { id: 'unit:uservicos||inicializar', label: 'Inicializar' },
        { id: 'unit:uservicos||registrarclasses', label: 'RegistrarClasses' },
        { id: 'unit:uservicos||ordenar', label: 'Ordenar' },
        { id: 'unit:uservicos||compararpornome', label: 'CompararPorNome' },
      ],
    });
  });

  test('nome da Unit sem diferenciar maiúsculas', async () => {
    const { handlers } = setup();
    expect((await handlers['methods:list']({}, 'uentidades')).methods.map((m) => m.label)).toEqual(['TEntidade.Salvar']);
  });

  test('Unit não analisada devolve lista vazia e o motivo', async () => {
    const { handlers } = setup();
    expect(await handlers['methods:list']({}, 'UQuebrada')).toEqual({
      methods: [],
      skipped: expect.stringContaining('linha 9, coluna 6'),
    });
  });

  test('sem Project carregado, falha com [NO_PROJECT]', async () => {
    const { handlers } = setup({ withProject: false });
    await expect(handlers['methods:list']({}, 'UServicos')).rejects.toThrow(/^\[NO_PROJECT\]/);
  });
});

describe('callerGraph:expand', () => {
  test('devolve o Caller Graph com o Target Method marcado', async () => {
    const { handlers } = setup();
    const graph = await handlers['callerGraph:expand']({}, 'unit:uclientes|tpedido|salvar');
    expect(Object.keys(graph).sort()).toEqual(['edges', 'nodes', 'skippedUnits']);
    expect(graph.nodes[0]).toMatchObject({ label: 'TPedido.Salvar', isTarget: true });
    expect(graph.nodes.filter((n) => n.isTarget)).toHaveLength(1);
  });

  test('id inexistente falha com [METHOD_NOT_FOUND]', async () => {
    const { handlers } = setup();
    await expect(handlers['callerGraph:expand']({}, 'unit:x||nada')).rejects.toMatchObject({
      code: 'METHOD_NOT_FOUND',
      message: expect.stringMatching(/^\[METHOD_NOT_FOUND\]/),
    });
  });

  test('listar Methods e depois expandir analisa o Project uma única vez', async () => {
    const { handlers, builds } = setup();
    await handlers['methods:list']({}, 'UServicos');
    await handlers['callerGraph:expand']({}, 'unit:uclientes|tpedido|salvar');
    expect(builds()).toBe(1);
  });
});
