import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import GraphView from './GraphView.svelte';

// Mock vis-network pois requer canvas/DOM construído
vi.mock('vis-network', () => ({
  Network: vi.fn(function(container, data, options) {
    this.destroy = vi.fn();
    this.once = vi.fn((event, cb) => {
      if (event === 'stabilizationIterationsDone') {
        setTimeout(cb, 0);
      }
    });
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
    expect(document.querySelector('.network-container canvas')).not.toBeNull();
  });

  it('valida que pelo menos um filtro de uses clause deve estar marcado', () => {
    const interfaceCheckbox = document.querySelector('.viewFilterInterface');
    const implementationCheckbox = document.querySelector('.viewFilterImplementation');

    // Tenta desmarcar ambos - o último deve reverterpara marcado
    interfaceCheckbox.checked = false;
    interfaceCheckbox.dispatchEvent(new Event('change'));

    implementationCheckbox.checked = false;
    implementationCheckbox.dispatchEvent(new Event('change'));

    // Ao menos um deve estar marcado
    const atLeastOneChecked =
      interfaceCheckbox.checked || implementationCheckbox.checked;
    expect(atLeastOneChecked).toBe(true);
  });
});
