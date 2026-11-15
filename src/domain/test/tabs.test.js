import {
  WELCOME_TAB_ID,
  activateTab,
  canCloseTab,
  closeProjectTabs,
  closeTab,
  unitTabId,
  initialTabsState,
  nextTab,
  openUnitTab,
  openMethodTab,
  methodTabId,
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

test('closeProjectTabs mantém a Welcome Tab aberta e a ativa', () => {
  const state = closeProjectTabs(withTabs('UnitA', 'UnitB'));
  expect(ids(state)).toEqual([WELCOME_TAB_ID]);
  expect(state.activeId).toBe(WELCOME_TAB_ID);
  expect(state.activationOrder).toEqual([WELCOME_TAB_ID]);
});

test('closeProjectTabs com a Welcome Tab fechada a reabre e a ativa', () => {
  const state = closeProjectTabs(closeTab(withTabs('UnitA'), WELCOME_TAB_ID));
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

describe('Method Tab', () => {
  const methodTab = (methodId, label) => ({ id: methodTabId(methodId), title: label, methodId });
  const SALVAR = 'unit:unitcliente|tcliente|salvar';

  test('methodTabId não colide com unitTabId', () => {
    expect(methodTabId(SALVAR)).toBe(`method:${SALVAR}`);
    expect(methodTabId('unit:unita||x')).not.toBe(unitTabId('unita'));
    expect(methodTabId(SALVAR).startsWith('unit:')).toBe(false);
  });

  test('escolher um Method abre a Method Tab no fim da barra, ativa, mantendo a Unit Tab', () => {
    const state = openMethodTab(withTabs('UnitCliente'), methodTab(SALVAR, 'TCliente.Salvar'));
    expect(ids(state)).toEqual([WELCOME_TAB_ID, 'unit:unitcliente', methodTabId(SALVAR)]);
    expect(state.activeId).toBe(methodTabId(SALVAR));
    expect(state.tabs[2]).toMatchObject({ kind: 'method', title: 'TCliente.Salvar' });
  });

  test('Method que já tem Method Tab só é ativado, sem duplicar nem mudar de posição', () => {
    let state = openMethodTab(withTabs('UnitCliente'), methodTab(SALVAR, 'TCliente.Salvar'));
    state = activateTab(state, 'unit:unitcliente');
    state = openMethodTab(state, methodTab(SALVAR, 'TCliente.Salvar'));
    expect(ids(state)).toEqual([WELCOME_TAB_ID, 'unit:unitcliente', methodTabId(SALVAR)]);
    expect(state.activeId).toBe(methodTabId(SALVAR));
  });

  test('mesmo rótulo em Units diferentes gera Method Tabs distintas', () => {
    let state = openMethodTab(withTabs('UnitA', 'UnitB'), methodTab('unit:unita||inicializar', 'Inicializar'));
    state = openMethodTab(state, methodTab('unit:unitb||inicializar', 'Inicializar'));
    const methodTabs = state.tabs.filter((tab) => tab.kind === 'method');
    expect(methodTabs.map((tab) => tab.title)).toEqual(['Inicializar', 'Inicializar']);
    expect(new Set(methodTabs.map((tab) => tab.id)).size).toBe(2);
  });

  test('fechar a Unit Tab de origem não fecha a Method Tab', () => {
    let state = openMethodTab(withTabs('UnitCliente'), methodTab(SALVAR, 'TCliente.Salvar'));
    state = closeTab(state, 'unit:unitcliente');
    expect(ids(state)).toEqual([WELCOME_TAB_ID, methodTabId(SALVAR)]);
    expect(state.tabs[1]).toMatchObject({ kind: 'method', methodId: SALVAR });
  });

  test('abrir um Project fecha Unit Tabs e Method Tabs e ativa a Welcome Tab', () => {
    let state = openMethodTab(withTabs('UnitCliente'), methodTab(SALVAR, 'TCliente.Salvar'));
    state = closeProjectTabs(closeTab(state, WELCOME_TAB_ID));
    expect(ids(state)).toEqual([WELCOME_TAB_ID]);
    expect(state.activeId).toBe(WELCOME_TAB_ID);
  });
});
