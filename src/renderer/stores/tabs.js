import { writable } from 'svelte/store';
import {
  activateTab,
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
} from '../../domain/tabs/index.js';

/** Tabs abertas, Tab ativa e ordem de ativação (`src/domain/tabs/`).
 * Cada Unit Tab guarda `{ title, path, graph: { nodes, edges, rootUnitId } }`;
 * cada Method Tab, `{ title, methodId, unitName, unitPath, graph: { nodes,
 * edges, skippedUnits } }`.
 */
export const tabsStore = writable(initialTabsState());

const apply = (fn) => (...args) => tabsStore.update((state) => fn(state, ...args));

export const activate = apply(activateTab);
export const close = apply(closeTab);
export const closeAllProjectTabs = apply(closeProjectTabs);
export const showWelcome = apply(openWelcomeTab);
export const showNextTab = apply(nextTab);
export const showPreviousTab = apply(previousTab);

export function openGraph({ unitName, path, graph }) {
  tabsStore.update((state) =>
    openUnitTab(state, { id: unitTabId(unitName), title: unitName, path, graph }),
  );
}

export function openMethod({ methodId, label, unitName, unitPath, graph }) {
  tabsStore.update((state) =>
    openMethodTab(state, { id: methodTabId(methodId), title: label, methodId, unitName, unitPath, graph }),
  );
}
