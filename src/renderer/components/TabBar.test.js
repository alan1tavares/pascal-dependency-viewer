import { render, cleanup } from '@testing-library/svelte';
import { vi } from 'vitest';
import TabBar from './TabBar.svelte';

afterEach(() => cleanup());

const TABS = {
  tabs: [
    { id: 'welcome', kind: 'welcome' },
    { id: 'unit:unitcliente', kind: 'unit', title: 'UnitCliente', path: 'src\\UnitCliente.pas' },
    {
      id: 'method:unit:unitcliente|tcliente|salvar',
      kind: 'method',
      title: 'TCliente.Salvar',
      methodId: 'unit:unitcliente|tcliente|salvar',
      unitName: 'UnitCliente',
      unitPath: 'src\\UnitCliente.pas',
    },
  ],
  activeId: 'method:unit:unitcliente|tcliente|salvar',
  activationOrder: [],
};

test('Method Tab: título é o rótulo do Method e o tooltip é `Unit — caminho`', () => {
  render(TabBar, { props: { tabsState: TABS, onActivate: vi.fn(), onClose: vi.fn() } });
  const tabs = [...document.querySelectorAll('.tab')];
  expect(tabs.map((tab) => tab.querySelector('.tab-title').textContent)).toEqual(['Bem-vindo', 'UnitCliente', 'TCliente.Salvar']);
  expect(tabs.map((tab) => tab.getAttribute('title'))).toEqual([null, 'src\\UnitCliente.pas', 'UnitCliente — src\\UnitCliente.pas']);
});
