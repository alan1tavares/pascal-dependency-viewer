import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Network } from 'vis-network';
import GraphView from './GraphView.svelte';

// Mock vis-network pois requer canvas/DOM construído
vi.mock('vis-network', () => ({
  Network: vi.fn(function(container, data, options) {
    this.destroy = vi.fn();
    // Como no vis-network real, nada dispara depois de `destroy`; o teste não
    // depende do fim da estabilização.
    this.once = vi.fn();
    this.fit = vi.fn();
    this.setOptions = vi.fn();
  }),
}));

vi.mock('vis-data', () => ({
  DataSet: vi.fn(function(data = []) {
    this.data = data || [];
    this.clear = vi.fn(() => {
      this.data = [];
    });
    this.add = vi.fn((items) => {
      this.data = Array.isArray(items) ? items : [items];
    });
    this.update = vi.fn((items) => {
      const arr = Array.isArray(items) ? items : [items];
      arr.forEach(item => {
        const idx = this.data.findIndex(d => d.id === item.id);
        if (idx >= 0) {
          this.data[idx] = { ...this.data[idx], ...item };
        }
      });
    });
  }),
}));

const testGraph = {
  nodes: [
    { id: 'unit1', label: 'Unit1', group: 'projectUnit' },
    { id: 'unit2', label: 'Unit2', group: 'externalUnit' },
  ],
  edges: [{ from: 'unit1', to: 'unit2', origin: 'interface' }],
  rootUnitId: 'unit1',
};

describe('GraphView.svelte', () => {
  let component;

  beforeEach(() => {
    component = render(GraphView, { props: { graph: testGraph } });
  });

  afterEach(() => {
    component?.unmount?.();
  });

  it('monta componente sem erros', () => {
    expect(component).toBeDefined();
  });

  it('renderiza o container do grafo', () => {
    expect(document.querySelector('.network-container')).not.toBeNull();
  });

  it('renderiza checkboxes de filtro', () => {
    const interfaceCheckbox = document.querySelector('.viewFilterInterface');
    const implementationCheckbox = document.querySelector('.viewFilterImplementation');
    const externalCheckbox = document.querySelector('.viewFilterExternal');

    expect(interfaceCheckbox).toBeDefined();
    expect(implementationCheckbox).toBeDefined();
    expect(externalCheckbox).toBeDefined();
  });

  it('inicializa filtros com valores corretos', () => {
    const interfaceCheckbox = document.querySelector('.viewFilterInterface');
    const implementationCheckbox = document.querySelector('.viewFilterImplementation');
    const externalCheckbox = document.querySelector('.viewFilterExternal');

    expect(interfaceCheckbox.checked).toBe(true);
    expect(implementationCheckbox.checked).toBe(true);
    expect(externalCheckbox.checked).toBe(false);
  });

  it('renderiza na montagem o grafo recebido por prop', () => {
    // vis-network é mockado: em vez de procurar o <canvas>, verifica o que foi
    // entregue a ele.
    const [container, data] = Network.mock.calls.at(-1);
    expect(container).toBe(document.querySelector('.network-container'));
    expect(data.nodes.add).toHaveBeenCalledWith(testGraph.nodes);
    expect(data.edges.add).toHaveBeenCalledWith([
      expect.objectContaining({ from: 'unit1', to: 'unit2' }),
    ]);
  });

  it('valida que pelo menos um filtro de uses clause deve estar marcado', () => {
    const interfaceCheckbox = document.querySelector('.viewFilterInterface');
    const implementationCheckbox = document.querySelector('.viewFilterImplementation');

    // Tenta desmarcar ambos - o último deve reverterpara marcado
    // `change` borbulha no navegador; o Svelte 5 delega `onchange` à raiz.
    interfaceCheckbox.checked = false;
    interfaceCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

    implementationCheckbox.checked = false;
    implementationCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

    // Ao menos um deve estar marcado
    const atLeastOneChecked =
      interfaceCheckbox.checked || implementationCheckbox.checked;
    expect(atLeastOneChecked).toBe(true);
  });
});
