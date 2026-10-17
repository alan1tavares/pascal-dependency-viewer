import { writable } from 'svelte/store';
import {
  activateTab,
  closeGraphTabs,
  closeTab,
  graphTabId,
  initialTabsState,
  nextTab,
  openGraphTab,
  openWelcomeTab,
  previousTab,
} from '../../domain/tabs/index.js';

/** Tabs abertas, Tab ativa e ordem de ativação (`src/domain/tabs/`).
 * Cada Graph Tab guarda `{ title, path, graph: { nodes, edges, rootUnitId } }`.
 */
export const tabsStore = writable(initialTabsState());

const apply = (fn) => (...args) => tabsStore.update((state) => fn(state, ...args));

export const activate = apply(activateTab);
export const close = apply(closeTab);
export const closeAllGraphTabs = apply(closeGraphTabs);
export const showWelcome = apply(openWelcomeTab);
export const showNextTab = apply(nextTab);
export const showPreviousTab = apply(previousTab);

export function openGraph({ unitName, path, graph }) {
  tabsStore.update((state) =>
    openGraphTab(state, { id: graphTabId(unitName), title: unitName, path, graph }),
  );
}
