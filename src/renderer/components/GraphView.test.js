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

describe('GraphView.svelte', () => {
  let component;

  beforeEach(() => {
    component = render(GraphView);
  });

  afterEach(() => {
    component?.unmount?.();
  });

  it('monta componente sem erros', () => {
    expect(component).toBeDefined();
  });

  it('renderiza container com id mynetwork', () => {
    const container = document.getElementById('mynetwork');
    expect(container).toBeDefined();
  });

  it('renderiza checkboxes de filtro', () => {
    const interfaceCheckbox = document.getElementById('viewFilterInterface');
    const implementationCheckbox = document.getElementById('viewFilterImplementation');
    const externalCheckbox = document.getElementById('viewFilterExternal');

    expect(interfaceCheckbox).toBeDefined();
    expect(implementationCheckbox).toBeDefined();
    expect(externalCheckbox).toBeDefined();
  });

  it('inicializa filtros com valores corretos', () => {
    const interfaceCheckbox = document.getElementById('viewFilterInterface');
    const implementationCheckbox = document.getElementById('viewFilterImplementation');
    const externalCheckbox = document.getElementById('viewFilterExternal');

    expect(interfaceCheckbox.checked).toBe(true);
    expect(implementationCheckbox.checked).toBe(true);
    expect(externalCheckbox.checked).toBe(false);
  });

  it('renderiza grafo quando renderGraph é chamado', async () => {
    const testNodes = [
      { id: 'unit1', label: 'Unit1', group: 'projectUnit' },
      { id: 'unit2', label: 'Unit2', group: 'externalUnit' },
    ];
    const testEdges = [
      { from: 'unit1', to: 'unit2', origin: 'interface' },
    ];

    component.renderGraph(testNodes, testEdges, 'unit1');

    await new Promise(resolve => setTimeout(resolve, 10));

    const container = document.getElementById('mynetwork');
    expect(container.style.display).toBe('block');
  });

  it('valida que pelo menos um filtro de uses clause deve estar marcado', () => {
    const interfaceCheckbox = document.getElementById('viewFilterInterface');
    const implementationCheckbox = document.getElementById('viewFilterImplementation');

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
