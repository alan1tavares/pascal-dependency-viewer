import type { Page } from '@playwright/test'

export type Graph = {
  nodes: { id: string; label: string; group: string }[]
  edges: { from: string; to: string; origin: string }[]
  rootUnitId: string
}

export const SAMPLE_PROJECT = {
  projectDir: '/sample',
  projectUnits: [
    { unitName: 'UnitPrincipal', path: 'UnitPrincipal.pas' },
    { unitName: 'UnitA', path: 'UnitA.pas' },
    { unitName: 'UnitB', path: 'UnitB.pas' },
  ],
}

/** Grafo que o main process produziria para `e2e/fixtures/sample-project`. */
export const SAMPLE_GRAPH: Graph = {
  nodes: [
    { id: 'unitprincipal', label: 'UnitPrincipal', group: 'projectUnit' },
    { id: 'system.sysutils', label: 'System.SysUtils', group: 'externalUnit' },
    { id: 'unita', label: 'UnitA', group: 'projectUnit' },
    { id: 'unitb', label: 'UnitB', group: 'projectUnit' },
    { id: 'system.classes', label: 'System.Classes', group: 'externalUnit' },
  ],
  edges: [
    { from: 'unitprincipal', to: 'system.sysutils', origin: 'interface' },
    { from: 'unitprincipal', to: 'unita', origin: 'interface' },
    { from: 'unitprincipal', to: 'unitb', origin: 'implementation' },
    { from: 'unitprincipal', to: 'system.classes', origin: 'implementation' },
    { from: 'unita', to: 'system.sysutils', origin: 'interface' },
    { from: 'unita', to: 'unitb', origin: 'interface' },
    { from: 'unitb', to: 'system.classes', origin: 'interface' },
  ],
  rootUnitId: 'unitprincipal',
}

/** Stuba `window.pascalDependencyViewer` (normalmente exposto pelo preload) e
 * expõe `window.__emit(channel, payload)` para simular os pushes do main. */
export async function stubPreload(page: Page, graph: Graph = SAMPLE_GRAPH) {
  await page.addInitScript((graph) => {
    const listeners: Record<string, ((payload?: unknown) => void)[]> = {}
    ;(window as any).__emit = (channel: string, payload?: unknown) =>
      (listeners[channel] || []).forEach((cb) => cb(payload))
    const on = (channel: string) => (cb: (payload?: unknown) => void) => {
      ;(listeners[channel] ||= []).push(cb)
      return () => {}
    }
    ;(window as any).pascalDependencyViewer = {
      platform: 'darwin',
      openProject: async () => null,
      expandFromRootUnit: async () => graph,
      listRecentProjects: async () => [],
      openRecentProject: async () => {},
      runCommand: async () => {},
      onProjectLoaded: on('app:project-loaded'),
      onShowCommandPalette: on('app:show-command-palette'),
      onShowOpenRecent: on('app:show-open-recent'),
      onShowRootUnitSelection: on('app:show-root-unit-selection'),
    }
  }, graph)
}

export async function loadProject(page: Page, project = SAMPLE_PROJECT) {
  await page.evaluate((p) => (window as any).__emit('app:project-loaded', p), project)
}

export function networkContainerHeight(page: Page) {
  return page.evaluate(() =>
    Math.round(document.querySelector('.network-container')!.getBoundingClientRect().height)
  )
}
