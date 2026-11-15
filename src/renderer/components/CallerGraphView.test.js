import { render, cleanup } from '@testing-library/svelte';
import { vi } from 'vitest';
import { Network } from 'vis-network';
import CallerGraphView from './CallerGraphView.svelte';

vi.mock('vis-network', () => ({
  Network: vi.fn(function Network() {
    this.fit = vi.fn();
    this.on = vi.fn();
    this.destroy = vi.fn();
  }),
}));
vi.mock('vis-data', () => ({
  DataSet: vi.fn(function DataSet(items) {
    this.items = items;
  }),
}));

const node = (id, label, extra = {}) => ({ id, label, unitName: 'UnitCliente', kind: 'method', isTarget: false, isEntryPoint: false, ...extra });
const edge = (from, to, extra = {}) => ({ from, to, isBackEdge: false, isPolymorphic: false, ...extra });

const GRAPH = {
  nodes: [
    node('t', 'TCliente.Salvar', { isTarget: true, isEntryPoint: true }),
    node('a', 'A'),
    node('h', 'TFormCliente.BtnSalvarClick', { isEntryPoint: true, unitName: 'UnitFormCliente' }),
    { id: 'init:unitconfig', label: 'UnitConfig (initialization)', unitName: 'UnitConfig', kind: 'initialization', isTarget: false, isEntryPoint: true },
    { id: 'program:p', label: 'Programa', unitName: 'P', kind: 'program', isTarget: false, isEntryPoint: true },
  ],
  edges: [
    edge('a', 't'),
    edge('t', 't'),
    edge('h', 'a'),
    edge('t', 'a', { isBackEdge: true }),
    edge('init:unitconfig', 't', { isPolymorphic: true, viaId: 'unit:u|tbase|salvar', viaLabel: 'TBase.Salvar' }),
    edge('program:p', 'h'),
  ],
  skippedUnits: [],
};

afterEach(() => {
  cleanup();
  Network.mockClear();
});

function drawn(graph = GRAPH) {
  render(CallerGraphView, { props: { graph } });
  const [container, data, options] = Network.mock.calls.at(-1);
  const nodes = Object.fromEntries(data.nodes.items.map((n) => [n.id, n]));
  const edges = Object.fromEntries(data.edges.items.map((e) => [e.id, e]));
  return { container, nodes, edges, options, network: Network.mock.instances.at(-1) };
}

describe('layout e interação', () => {
  test('hierárquico de baixo para cima, sem física, com níveis do Target Method para cima', () => {
    const { options, nodes, container } = drawn();
    expect(container).toBe(document.querySelector('.network-container'));
    expect(options.layout.hierarchical).toMatchObject({ enabled: true, direction: 'DU' });
    expect(options.physics).toBe(false);
    expect(nodes.t.level).toBe(0);
    expect(nodes.a.level).toBe(1);
    expect(nodes.h.level).toBe(2);
    expect(nodes['program:p'].level).toBe(3);
  });

  test('setas do Caller para o Method chamado e enquadramento inicial', () => {
    const { options, edges, network } = drawn();
    expect(options.edges.arrows).toBe('to');
    expect(edges['a->t']).toMatchObject({ from: 'a', to: 't' });
    expect(network.fit).toHaveBeenCalled();
  });

  test('sem handlers de clique e sem View Filter', () => {
    const { network } = drawn();
    expect(network.on).not.toHaveBeenCalled();
    expect(document.querySelector('.filter-panel')).toBeNull();
    expect(document.querySelector('input[type=checkbox]')).toBeNull();
  });
});

describe('nós', () => {
  test('grupos: Target prevalece sobre Entry Point; blocos; Entry Point; neutro', () => {
    const { nodes, options } = drawn();
    expect(nodes.t.group).toBe('target');
    expect(nodes.h.group).toBe('entryPoint');
    expect(nodes['init:unitconfig'].group).toBe('block');
    expect(nodes['program:p'].group).toBe('block');
    expect(nodes.a.group).toBe('method');
    expect(options.groups.block.color).toEqual(options.groups.entryPoint.color);
    expect(options.groups.block.shape).not.toBe(options.groups.method.shape);
    expect(options.groups.target.color).not.toEqual(options.groups.method.color);
  });

  test('rótulos: Method com a Unit na segunda linha; blocos só com o rótulo', () => {
    const { nodes } = drawn();
    expect(nodes.t.label).toBe('TCliente.Salvar\nUnitCliente');
    expect(nodes['program:p'].label).toBe('Programa');
    expect(nodes['init:unitconfig'].label).toBe('UnitConfig (initialization)');
  });

  test('Target Method sem Callers: só o nó destacado', () => {
    const { nodes, edges } = drawn({ nodes: [node('t', 'TCliente.Excluir', { isTarget: true })], edges: [], skippedUnits: [] });
    expect(Object.keys(nodes)).toEqual(['t']);
    expect(nodes.t.group).toBe('target');
    expect(edges).toEqual({});
  });
});

describe('arestas', () => {
  test('self-loop, back-edge tracejada e as demais contínuas', () => {
    const { edges } = drawn();
    expect(edges['t->t']).toMatchObject({ from: 't', to: 't', dashes: false });
    expect(edges['t->a'].dashes).toBe(true);
    // curvada, para não ficar escondida sob a aresta a->t
    expect(edges['t->a'].smooth).toMatchObject({ enabled: true, type: 'curvedCW' });
    expect(edges['a->t'].smooth).toBeUndefined();
    expect(edges['a->t'].dashes).toBe(false);
  });

  test('Polymorphic Call com cor própria e tooltip via, sem nó para a declaração', () => {
    const { edges, nodes } = drawn();
    const poly = edges['init:unitconfig->t'];
    expect(poly.title).toBe('via TBase.Salvar');
    expect(poly.color.color).toBeDefined();
    expect(edges['a->t'].color).toBeUndefined();
    expect(edges['a->t'].title).toBeUndefined();
    expect(Object.keys(nodes)).not.toContain('unit:u|tbase|salvar');
  });
});

describe('aviso de Units não analisadas', () => {
  test('lista as Units, com o motivo no tooltip, e o grafo é exibido mesmo assim', () => {
    drawn({ ...GRAPH, skippedUnits: [{ unitName: 'UnitLegada', reason: 'linha 3, coluna 1' }, { unitName: 'UnitVelha', reason: 'x' }] });
    const warning = document.querySelector('.skipped-warning');
    expect(warning.textContent).toContain('incompleto');
    const units = [...warning.querySelectorAll('.skipped-unit')];
    expect(units.map((u) => u.textContent)).toEqual(['UnitLegada', 'UnitVelha']);
    expect(units[0].getAttribute('title')).toBe('linha 3, coluna 1');
    expect(Network).toHaveBeenCalled();
  });

  test('sem Units não analisadas, sem aviso', () => {
    drawn();
    expect(document.querySelector('.skipped-warning')).toBeNull();
  });
});
