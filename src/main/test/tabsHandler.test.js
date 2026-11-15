import { registerActiveTabKindHandler } from '../ipc/tabs.js';

function setup() {
  const item = { enabled: false };
  const menu = { getMenuItemById: (id) => (id === 'selectMethod' ? item : null) };
  const listeners = {};
  registerActiveTabKindHandler({ on: (channel, fn) => { listeners[channel] = fn; } }, { getMenu: () => menu });
  const send = (kind) => listeners['tabs:active-kind']({}, kind);
  return { item, send };
}

test.each([
  ['unit', true],
  ['welcome', false],
  ['method', false],
])('Tab ativa %s deixa "Selecionar Método" com enabled = %s', (kind, enabled) => {
  const { item, send } = setup();
  send('unit');
  send(kind);
  expect(item.enabled).toBe(enabled);
});

test('acompanha cada troca da Tab ativa', () => {
  const { item, send } = setup();
  send('unit');
  expect(item.enabled).toBe(true);
  send('method');
  expect(item.enabled).toBe(false);
  send('unit');
  expect(item.enabled).toBe(true);
});

test('sem menu (ainda não montado) não falha', () => {
  const listeners = {};
  registerActiveTabKindHandler({ on: (c, fn) => { listeners[c] = fn; } }, { getMenu: () => null });
  expect(() => listeners['tabs:active-kind']({}, 'unit')).not.toThrow();
});
