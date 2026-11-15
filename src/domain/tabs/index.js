export const WELCOME_TAB_ID = 'welcome';

const WELCOME_TAB = { id: WELCOME_TAB_ID, kind: 'welcome' };

export function unitTabId(unitName) {
  return `unit:${unitName.toLowerCase()}`;
}

// O id do Method (`unit:<unit>|<classe>|<nome>`) também começa com `unit:`;
// o prefixo próprio evita colisão com o id de uma Unit Tab.
export function methodTabId(methodId) {
  return `method:${methodId}`;
}

export function initialTabsState() {
  return {
    tabs: [WELCOME_TAB],
    activeId: WELCOME_TAB_ID,
    activationOrder: [WELCOME_TAB_ID],
  };
}

export function activateTab(state, id) {
  if (!state.tabs.some((tab) => tab.id === id)) return state;
  return {
    ...state,
    activeId: id,
    activationOrder: [id, ...state.activationOrder.filter((item) => item !== id)],
  };
}

function openTab(state, tab) {
  if (state.tabs.some((item) => item.id === tab.id)) {
    return activateTab(state, tab.id);
  }
  return activateTab({ ...state, tabs: [...state.tabs, tab] }, tab.id);
}

export function openWelcomeTab(state) {
  return openTab(state, WELCOME_TAB);
}

export function openUnitTab(state, tab) {
  return openTab(state, { ...tab, kind: 'unit' });
}

export function openMethodTab(state, tab) {
  return openTab(state, { ...tab, kind: 'method' });
}

export function canCloseTab(state, id) {
  return !(state.tabs.length === 1 && state.tabs[0].id === WELCOME_TAB_ID && id === WELCOME_TAB_ID);
}

export function closeTab(state, id) {
  if (!state.tabs.some((tab) => tab.id === id) || !canCloseTab(state, id)) return state;

  const tabs = state.tabs.filter((tab) => tab.id !== id);
  if (tabs.length === 0) return initialTabsState();

  const activationOrder = state.activationOrder.filter((item) => item !== id);
  const activeId = state.activeId === id ? activationOrder[0] : state.activeId;
  return { tabs, activeId, activationOrder };
}

// Abrir um Project fecha todas as Tabs dele (Unit Tabs e Method Tabs).
export function closeProjectTabs(state) {
  const tabs = state.tabs.filter((tab) => tab.kind !== 'unit' && tab.kind !== 'method');
  const remaining = new Set(tabs.map((tab) => tab.id));
  const cleared = {
    tabs,
    activeId: state.activeId,
    activationOrder: state.activationOrder.filter((item) => remaining.has(item)),
  };
  return openWelcomeTab(cleared);
}

function cycleTab(state, delta) {
  if (state.tabs.length < 2) return state;
  const index = state.tabs.findIndex((tab) => tab.id === state.activeId);
  const next = (index + delta + state.tabs.length) % state.tabs.length;
  return activateTab(state, state.tabs[next].id);
}

export function nextTab(state) {
  return cycleTab(state, 1);
}

export function previousTab(state) {
  return cycleTab(state, -1);
}
