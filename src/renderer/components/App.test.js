import { render, fireEvent, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import { get } from 'svelte/store';
import { vi } from 'vitest';
import { Network } from 'vis-network';
import App from './App.svelte';
import { tabsStore, openGraph, activate } from '../stores/tabs.js';
import { projectStore } from '../stores/project.js';
import { initialTabsState, WELCOME_TAB_ID, unitTabId, methodTabId } from '../../domain/tabs/index.js';

vi.mock('vis-network', () => ({
  Network: vi.fn(function Network() {
    this.fit = vi.fn();
    this.once = vi.fn();
    this.on = vi.fn();
    this.setOptions = vi.fn();
    this.destroy = vi.fn();
  }),
}));
vi.mock('vis-data', () => ({
  DataSet: vi.fn(function DataSet(items = []) {
    this.items = items;
    this.add = vi.fn();
    this.clear = vi.fn();
    this.update = vi.fn();
  }),
}));

const PROJECT = { projectDir: '/p', projectUnits: [{ unitName: 'UnitCliente', path: 'src\\UnitCliente.pas' }] };
const METHODS = [
  { id: 'unit:unitcliente|tcliente|salvar', label: 'TCliente.Salvar' },
  { id: 'unit:unitcliente||formatarcpf', label: 'FormatarCpf' },
];
const CALLER_GRAPH = {
  nodes: [{ id: METHODS[0].id, label: 'TCliente.Salvar', unitName: 'UnitCliente', kind: 'method', isTarget: true, isEntryPoint: false }],
  edges: [],
  skippedUnits: [],
};

// Um único objeto de API para todos os testes: a Command Palette é montada uma
// vez (serviço singleton) e guarda a referência.
const listeners = {};
const api = { platform: 'linux' };
window.pascalDependencyViewer = api;
const emit = (channel, payload) => (listeners[channel] || []).forEach((cb) => cb(payload));
const on = (channel) => (cb) => {
  (listeners[channel] ||= []).push(cb);
  return () => {};
};

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const flush = async () => {
  for (let i = 0; i < 4; i++) {
    await Promise.resolve();
    await tick();
  }
};

beforeAll(() => {
  const container = document.createElement('div');
  container.id = 'commandPaletteContainer';
  document.body.appendChild(container);
});

beforeEach(() => {
  for (const key of Object.keys(listeners)) delete listeners[key];
  Object.assign(api, {
    openProject: vi.fn(),
    expandFromRootUnit: vi.fn(async () => ({ nodes: [], edges: [], rootUnitId: 'unitcliente' })),
    listRecentProjects: vi.fn(async () => []),
    openRecentProject: vi.fn(),
    runCommand: vi.fn(),
    listUnitMethods: vi.fn(async () => ({ methods: METHODS })),
    expandCallerGraph: vi.fn(async () => CALLER_GRAPH),
    setActiveTabKind: vi.fn(),
    onProjectLoaded: on('app:project-loaded'),
    onShowCommandPalette: on('app:show-command-palette'),
    onShowOpenRecent: on('app:show-open-recent'),
    onShowRootUnitSelection: on('app:show-root-unit-selection'),
    onShowWelcome: on('app:show-welcome'),
    onShowMethodSelection: on('app:show-method-selection'),
  });
  window.alert = vi.fn();
  tabsStore.set(initialTabsState());
  projectStore.set(null);
  Network.mockClear();
  render(App);
});

afterEach(async () => {
  // Fecha a paleta (singleton) entre um teste e outro.
  const overlay = document.querySelector('#commandPaletteOverlay');
  if (overlay) await fireEvent.mouseDown(overlay);
  cleanup();
});

async function openUnitTab() {
  projectStore.set(PROJECT);
  openGraph({ unitName: 'UnitCliente', path: 'src\\UnitCliente.pas', graph: { nodes: [], edges: [], rootUnitId: 'unitcliente' } });
  await flush();
}

const methodItems = () => [...document.querySelectorAll('.commandItem')].map((el) => el.textContent.trim());
const tabTitles = () => [...document.querySelectorAll('.tab-title')].map((el) => el.textContent);
const activeTitle = () => document.querySelector('.tab.active .tab-title').textContent;

async function chooseMethod(label) {
  emit('app:show-method-selection');
  await flush();
  const item = [...document.querySelectorAll('.commandItem')].find((el) => el.textContent.trim() === label);
  await fireEvent.click(item);
  await flush();
}

describe('tipo da Tab ativa enviado ao main', () => {
  test('inicial, Unit Tab, Method Tab e Welcome Tab', async () => {
    await flush();
    expect(api.setActiveTabKind).toHaveBeenLastCalledWith('welcome');
    await openUnitTab();
    expect(api.setActiveTabKind).toHaveBeenLastCalledWith('unit');
    await chooseMethod('TCliente.Salvar');
    expect(api.setActiveTabKind).toHaveBeenLastCalledWith('method');
    activate(WELCOME_TAB_ID);
    await flush();
    expect(api.setActiveTabKind).toHaveBeenLastCalledWith('welcome');
  });
});

describe('Selecionar Método pelo menu', () => {
  test('abre o modo com os Methods da Root Unit da Unit Tab ativa', async () => {
    await openUnitTab();
    emit('app:show-method-selection');
    await flush();
    expect(api.listUnitMethods).toHaveBeenCalledWith('UnitCliente');
    expect(document.querySelector('#commandPalettePrefix').textContent).toBe('Selecionar Método');
    expect(methodItems()).toEqual(['TCliente.Salvar', 'FormatarCpf']);
  });

  test('sem Unit Tab ativa, o push é ignorado', async () => {
    await flush();
    emit('app:show-method-selection');
    await flush();
    expect(api.listUnitMethods).not.toHaveBeenCalled();
    expect(document.querySelector('#commandPaletteOverlay')).toBeNull();
  });

  test('Esc durante a análise e reentrada com o índice pronto', async () => {
    const first = deferred();
    api.listUnitMethods = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(async () => ({ methods: METHODS }));
    await openUnitTab();
    emit('app:show-method-selection');
    await flush();
    expect(document.querySelector('#commandPaletteEmpty').textContent.trim()).toBe('Analisando Project…');
    await fireEvent.keyDown(document.querySelector('#commandPaletteInput'), { key: 'Escape' });
    expect(document.querySelector('#commandPaletteOverlay')).toBeNull();
    first.resolve({ methods: METHODS });
    emit('app:show-method-selection');
    await flush();
    expect(document.querySelector('#commandPaletteEmpty')).toBeNull();
    expect(methodItems()).toEqual(['TCliente.Salvar', 'FormatarCpf']);
  });
});

describe('escolher um Method', () => {
  test('abre a Method Tab no fim da barra, ativa, com título e tooltip', async () => {
    await openUnitTab();
    await chooseMethod('TCliente.Salvar');
    expect(api.expandCallerGraph).toHaveBeenCalledWith('unit:unitcliente|tcliente|salvar');
    expect(tabTitles()).toEqual(['Bem-vindo', 'UnitCliente', 'TCliente.Salvar']);
    expect(activeTitle()).toBe('TCliente.Salvar');
    const tab = document.querySelector(`[data-tab-id="${CSS.escape(methodTabId(METHODS[0].id))}"]`);
    expect(tab.getAttribute('title')).toBe('UnitCliente — src\\UnitCliente.pas');
    expect(document.querySelector('.tab-panel.active .caller-graph')).not.toBeNull();
  });

  test('escolher de novo só ativa a Method Tab, sem recalcular', async () => {
    await openUnitTab();
    await chooseMethod('TCliente.Salvar');
    activate(unitTabId('UnitCliente'));
    await flush();
    await chooseMethod('TCliente.Salvar');
    expect(api.expandCallerGraph).toHaveBeenCalledTimes(1);
    expect(tabTitles()).toEqual(['Bem-vindo', 'UnitCliente', 'TCliente.Salvar']);
    expect(activeTitle()).toBe('TCliente.Salvar');
  });

  test('[PROJECT_REPLACED] é descartado em silêncio', async () => {
    api.expandCallerGraph = vi.fn(async () => { throw new Error('Error: [PROJECT_REPLACED] x'); });
    await openUnitTab();
    await chooseMethod('TCliente.Salvar');
    expect(window.alert).not.toHaveBeenCalled();
    expect(tabTitles()).toEqual(['Bem-vindo', 'UnitCliente']);
  });

  test('resultado que chega depois de outro Project ser carregado é descartado', async () => {
    const pending = deferred();
    api.expandCallerGraph = vi.fn(() => pending.promise);
    await openUnitTab();
    await chooseMethod('TCliente.Salvar');
    emit('app:project-loaded', { projectDir: '/q', projectUnits: [] });
    pending.resolve(CALLER_GRAPH);
    await flush();
    expect(tabTitles()).toEqual(['Bem-vindo']);
  });

  test('outros erros alertam e não abrem Tab', async () => {
    api.expandCallerGraph = vi.fn(async () => { throw new Error('[METHOD_NOT_FOUND] Method não encontrado'); });
    await openUnitTab();
    await chooseMethod('TCliente.Salvar');
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('TCliente.Salvar'));
    expect(tabTitles()).toEqual(['Bem-vindo', 'UnitCliente']);
  });
});

describe('Method Tab montada', () => {
  test('alternar Tabs preserva o Caller Graph sem redesenhar', async () => {
    await openUnitTab();
    await chooseMethod('TCliente.Salvar');
    const created = Network.mock.calls.length;
    activate(WELCOME_TAB_ID);
    await flush();
    const panel = document.querySelector('.caller-graph').closest('.tab-panel');
    expect(panel.classList.contains('active')).toBe(false);
    expect(panel.inert || panel.hasAttribute('inert')).toBe(true);
    activate(methodTabId(METHODS[0].id));
    await flush();
    expect(Network.mock.calls.length).toBe(created);
    expect(panel.classList.contains('active')).toBe(true);
  });

  test('cancelar o diálogo de abrir Project mantém a Method Tab e a Tab ativa', async () => {
    await openUnitTab();
    await chooseMethod('TCliente.Salvar');
    // Cancelar o diálogo nativo não envia app:project-loaded: o renderer só
    // vê a paleta fechar.
    emit('app:show-command-palette');
    await flush();
    await fireEvent.keyDown(document.querySelector('#commandPaletteInput'), { key: 'Escape' });
    await flush();
    expect(tabTitles()).toEqual(['Bem-vindo', 'UnitCliente', 'TCliente.Salvar']);
    expect(activeTitle()).toBe('TCliente.Salvar');
  });

  test('abrir um Project fecha Unit Tabs e Method Tabs', async () => {
    await openUnitTab();
    await chooseMethod('TCliente.Salvar');
    emit('app:project-loaded', PROJECT);
    await flush();
    expect(get(tabsStore).tabs.map((t) => t.kind)).toEqual(['welcome']);
  });
});
