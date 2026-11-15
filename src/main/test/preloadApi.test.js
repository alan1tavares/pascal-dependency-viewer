import { vi } from 'vitest';

const invoke = vi.fn(async () => 'ok');
vi.doMock('electron', () => ({ ipcRenderer: { invoke, on: vi.fn(), removeListener: vi.fn() } }));

const { api } = await import('../../preload/api.js');

test('listUnitMethods invoca methods:list com o nome da Unit', async () => {
  await api.listUnitMethods('UClientes');
  expect(invoke).toHaveBeenLastCalledWith('methods:list', 'UClientes');
});

test('expandCallerGraph invoca callerGraph:expand com o id do Method', async () => {
  await api.expandCallerGraph('unit:uclientes|tcliente|salvar');
  expect(invoke).toHaveBeenLastCalledWith('callerGraph:expand', 'unit:uclientes|tcliente|salvar');
});
