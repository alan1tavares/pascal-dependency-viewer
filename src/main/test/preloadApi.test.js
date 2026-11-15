import { vi } from 'vitest';

const invoke = vi.fn(async () => 'ok');
const send = vi.fn();
const on = vi.fn();
const removeListener = vi.fn();
vi.doMock('electron', () => ({ ipcRenderer: { invoke, send, on, removeListener } }));

const { api } = await import('../../preload/api.js');

test('listUnitMethods invoca methods:list com o nome da Unit', async () => {
  await api.listUnitMethods('UClientes');
  expect(invoke).toHaveBeenLastCalledWith('methods:list', 'UClientes');
});

test('expandCallerGraph invoca callerGraph:expand com o id do Method', async () => {
  await api.expandCallerGraph('unit:uclientes|tcliente|salvar');
  expect(invoke).toHaveBeenLastCalledWith('callerGraph:expand', 'unit:uclientes|tcliente|salvar');
});

test('setActiveTabKind envia tabs:active-kind sem esperar resposta', () => {
  api.setActiveTabKind('unit');
  expect(send).toHaveBeenLastCalledWith('tabs:active-kind', 'unit');
  expect(invoke).not.toHaveBeenCalledWith('tabs:active-kind', expect.anything());
});

test('onShowMethodSelection escuta app:show-method-selection e devolve o cancelamento', () => {
  const callback = vi.fn();
  const unsubscribe = api.onShowMethodSelection(callback);
  const [channel, listener] = on.mock.calls.at(-1);
  expect(channel).toBe('app:show-method-selection');
  listener({}, 'ignorado');
  expect(callback).toHaveBeenCalledWith();
  unsubscribe();
  expect(removeListener).toHaveBeenCalledWith('app:show-method-selection', listener);
});
