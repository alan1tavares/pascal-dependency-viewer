import {
  WELCOME_TAB_ID,
  activateTab,
  canCloseTab,
  closeUnitTabs,
  closeTab,
  unitTabId,
  initialTabsState,
  nextTab,
  openUnitTab,
  openWelcomeTab,
  previousTab,
} from '../tabs/index.js';
import expandDependencyGraph from '../expandDependencyGraph/index.js';

const ids = (state) => state.tabs.map((tab) => tab.id);
const unitTab = (unitName) => ({ id: unitTabId(unitName), title: unitName });

function withTabs(...unitNames) {
  return unitNames.reduce((state, unitName) => openUnitTab(state, unitTab(unitName)), initialTabsState());
}

test('estado inicial tem só a Welcome Tab, ativa', () => {
  const state = initialTabsState();
  expect(ids(state)).toEqual([WELCOME_TAB_ID]);
  expect(state.activeId).toBe(WELCOME_TAB_ID);
});

test('nova Unit Tab entra no fim da barra e fica ativa', () => {
  const state = withTabs('UnitA', 'UnitB');
  expect(ids(state)).toEqual([WELCOME_TAB_ID, 'unit:unita', 'unit:unitb']);
  expect(state.activeId).toBe('unit:unitb');
  expect(state.tabs[2]).toMatchObject({ kind: 'unit', title: 'UnitB' });
});

test('Root Unit que já tem Unit Tab só é ativada, sem duplicar nem mudar de posição', () => {
  const state = openUnitTab(withTabs('UnitA', 'UnitB'), unitTab('UnitA'));
  expect(ids(state)).toEqual([WELCOME_TAB_ID, 'unit:unita', 'unit:unitb']);
  expect(state.activeId).toBe('unit:unita');
});

test('fechar a Tab ativa ativa a que foi ativada mais recentemente', () => {
  let state = withTabs('UnitA', 'UnitB');
  state = activateTab(state, 'unit:unita');
  state = activateTab(state, WELCOME_TAB_ID);
  state = activateTab(state, 'unit:unitb');
  state = closeTab(state, 'unit:unitb');
  expect(ids(state)).toEqual([WELCOME_TAB_ID, 'unit:unita']);
  expect(state.activeId).toBe(WELCOME_TAB_ID);
});

test('fechar uma Tab inativa mantém a Tab ativa', () => {
  let state = activateTab(withTabs('UnitA', 'UnitB'), 'unit:unita');
  state = closeTab(state, 'unit:unitb');
  expect(ids(state)).toEqual([WELCOME_TAB_ID, 'unit:unita']);
  expect(state.activeId).toBe('unit:unita');
});

test('fechar a última Unit Tab reabre a Welcome Tab', () => {
  let state = closeTab(withTabs('UnitA'), WELCOME_TAB_ID);
  expect(ids(state)).toEqual(['unit:unita']);
  state = closeTab(state, 'unit:unita');
  expect(ids(state)).toEqual([WELCOME_TAB_ID]);
  expect(state.activeId).toBe(WELCOME_TAB_ID);
});

test('Welcome Tab sozinha não pode ser fechada', () => {
  const state = initialTabsState();
  expect(canCloseTab(state, WELCOME_TAB_ID)).toBe(false);
  expect(closeTab(state, WELCOME_TAB_ID)).toBe(state);
});

test('Welcome Tab com uma Unit Tab aberta pode ser fechada', () => {
  const state = withTabs('UnitA');
  expect(canCloseTab(state, WELCOME_TAB_ID)).toBe(true);
  expect(ids(closeTab(state, WELCOME_TAB_ID))).toEqual(['unit:unita']);
});

test('openWelcomeTab com a Welcome Tab fechada a adiciona no fim e a ativa', () => {
  let state = closeTab(withTabs('UnitA', 'UnitB'), WELCOME_TAB_ID);
  state = openWelcomeTab(state);
  expect(ids(state)).toEqual(['unit:unita', 'unit:unitb', WELCOME_TAB_ID]);
  expect(state.activeId).toBe(WELCOME_TAB_ID);
});

test('openWelcomeTab com a Welcome Tab aberta só a ativa', () => {
  const state = openWelcomeTab(withTabs('UnitA'));
  expect(ids(state)).toEqual([WELCOME_TAB_ID, 'unit:unita']);
  expect(state.activeId).toBe(WELCOME_TAB_ID);
});

test('closeUnitTabs mantém a Welcome Tab aberta e a ativa', () => {
  const state = closeUnitTabs(withTabs('UnitA', 'UnitB'));
  expect(ids(state)).toEqual([WELCOME_TAB_ID]);
  expect(state.activeId).toBe(WELCOME_TAB_ID);
  expect(state.activationOrder).toEqual([WELCOME_TAB_ID]);
});

test('closeUnitTabs com a Welcome Tab fechada a reabre e a ativa', () => {
  const state = closeUnitTabs(closeTab(withTabs('UnitA'), WELCOME_TAB_ID));
  expect(ids(state)).toEqual([WELCOME_TAB_ID]);
  expect(state.activeId).toBe(WELCOME_TAB_ID);
});

test('nextTab e previousTab seguem a posição na barra, em ciclo', () => {
  let state = activateTab(withTabs('UnitA', 'UnitB'), 'unit:unita');
  state = nextTab(state);
  expect(state.activeId).toBe('unit:unitb');
  state = nextTab(state);
  expect(state.activeId).toBe(WELCOME_TAB_ID);
  state = previousTab(state);
  expect(state.activeId).toBe('unit:unitb');
});

test('nextTab e previousTab não fazem nada com uma única Tab', () => {
  const state = initialTabsState();
  expect(nextTab(state)).toBe(state);
  expect(previousTab(state)).toBe(state);
});

test('unitTabId usa o mesmo id que expandDependencyGraph dá à Root Unit', () => {
  const projectUnits = [{ unitName: 'UnitPrincipal', path: 'UnitPrincipal.pas' }];
  const { rootUnitId } = expandDependencyGraph('UnitPrincipal', projectUnits, () => 'unit UnitPrincipal;\ninterface\nimplementation\nend.');
  expect(unitTabId('UnitPrincipal')).toBe(`unit:${rootUnitId}`);
});
