import { render, fireEvent, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import { vi } from 'vitest';
import CommandPalette from './CommandPalette.svelte';

const METHODS = [
  { id: 'unit:unitcliente|tcliente|salvar', label: 'TCliente.Salvar' },
  { id: 'unit:unitcliente||formatarcpf', label: 'FormatarCpf' },
  { id: 'unit:unitcliente|tcliente|carregar', label: 'TCliente.Carregar' },
];
const UNIT = { unitName: 'UnitCliente', path: 'src\\UnitCliente.pas' };

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
  for (let i = 0; i < 3; i++) {
    await Promise.resolve();
    await tick();
  }
};

let api;
let palette;
let onMethodSelected;

function setup({ activeTabKind = 'unit', listUnitMethods } = {}) {
  api = {
    platform: 'linux',
    runCommand: vi.fn(),
    listRecentProjects: vi.fn(async () => []),
    openRecentProject: vi.fn(),
    listUnitMethods: listUnitMethods ?? vi.fn(async () => ({ methods: METHODS })),
  };
  window.pascalDependencyViewer = api;
  window.alert = vi.fn();
  onMethodSelected = vi.fn();
  const { component } = render(CommandPalette);
  palette = component;
  palette.configure({
    hasProject: () => true,
    getProject: () => ({ projectUnits: [UNIT], projectDir: '/p' }),
    getActiveTabKind: () => activeTabKind,
    getActiveUnit: () => (activeTabKind === 'unit' ? UNIT : null),
    onRootUnitSelected: vi.fn(),
    onMethodSelected,
  });
}

afterEach(() => cleanup());

const input = () => document.querySelector('#commandPaletteInput');
const items = () => [...document.querySelectorAll('.commandItem')].map((el) => el.textContent.trim().replace(/\s+/g, ' '));
const selected = () => document.querySelector('.commandItem.selected')?.textContent.trim();
const empty = () => document.querySelector('#commandPaletteEmpty')?.textContent.trim();
const prefix = () => document.querySelector('#commandPalettePrefix')?.textContent.trim();
const isOpen = () => document.querySelector('#commandPaletteOverlay') !== null;
const press = (key) => fireEvent.keyDown(input(), { key });
const type = async (text) => {
  await fireEvent.input(input(), { target: { value: text } });
};

async function openFromCommand() {
  palette.showCommandPalette();
  await tick();
  const button = [...document.querySelectorAll('.commandItem')].find((el) => el.textContent.includes('Selecionar Método'));
  await fireEvent.click(button);
  await flush();
}

describe('lista de Commands', () => {
  test('com uma Unit Tab ativa mostra Selecionar Método, sem dica de atalho', async () => {
    setup({ activeTabKind: 'unit' });
    palette.showCommandPalette();
    await tick();
    expect(items()).toEqual([
      'Abrir projeto (.dpr) Ctrl+O',
      'Abrir recente Ctrl+K R',
      'Selecionar Unit',
      'Selecionar Método',
      'Bem-vindo',
    ]);
  });

  test.each(['welcome', 'method'])('com a Tab %s ativa omite Selecionar Método', async (kind) => {
    setup({ activeTabKind: kind });
    palette.showCommandPalette();
    await tick();
    expect(items()).not.toContain('Selecionar Método');
  });
});

describe('modo Selecionar Método', () => {
  test('o Command troca de modo sem fechar a paleta e sem IPC de comando', async () => {
    setup();
    await openFromCommand();
    expect(isOpen()).toBe(true);
    expect(api.runCommand).not.toHaveBeenCalled();
    expect(api.listUnitMethods).toHaveBeenCalledWith('UnitCliente');
    expect(prefix()).toBe('Selecionar Método');
    expect(input().placeholder).toBe('Digite o nome do método');
  });

  test('lista os Methods na ordem recebida, com o primeiro destacado', async () => {
    setup();
    await openFromCommand();
    expect(items()).toEqual(['TCliente.Salvar', 'FormatarCpf', 'TCliente.Carregar']);
    expect(selected()).toBe('TCliente.Salvar');
  });

  test('filtra por parte do rótulo e mostra mensagem sem resultado', async () => {
    setup();
    await openFromCommand();
    await type('cliente.');
    expect(items()).toEqual(['TCliente.Salvar', 'TCliente.Carregar']);
    await type('xyz');
    expect(items()).toEqual([]);
    expect(empty()).toBe('Nenhum método encontrado');
  });

  test('Analisando Project… até a análise terminar, aplicando o texto já digitado', async () => {
    const pending = deferred();
    setup({ listUnitMethods: vi.fn(() => pending.promise) });
    palette.enterMethodMode(UNIT, { entry: 'direct' });
    await flush();
    expect(empty()).toBe('Analisando Project…');
    expect(items()).toEqual([]);
    await type('carregar');
    expect(empty()).toBe('Analisando Project…');
    pending.resolve({ methods: METHODS });
    await flush();
    expect(items()).toEqual(['TCliente.Carregar']);
  });

  test('Unit sem Methods', async () => {
    setup({ listUnitMethods: vi.fn(async () => ({ methods: [] })) });
    palette.enterMethodMode(UNIT, { entry: 'direct' });
    await flush();
    expect(empty()).toBe('Esta Unit não tem métodos');
  });

  test('Unit que não pôde ser analisada mostra o motivo, sem lista', async () => {
    setup({ listUnitMethods: vi.fn(async () => ({ methods: [], skipped: "Esperado ';' (linha 3, coluna 1)" })) });
    palette.enterMethodMode(UNIT, { entry: 'direct' });
    await flush();
    expect(items()).toEqual([]);
    expect(empty()).toBe("Não foi possível analisar esta Unit: Esperado ';' (linha 3, coluna 1)");
  });

  test('↓ e Enter escolhem o Method destacado, fechando a paleta', async () => {
    setup();
    await openFromCommand();
    await press('ArrowDown');
    await press('Enter');
    expect(onMethodSelected).toHaveBeenCalledWith(METHODS[1], UNIT);
    expect(isOpen()).toBe(false);
  });

  test('clique escolhe o Method', async () => {
    setup();
    await openFromCommand();
    await fireEvent.click(document.querySelectorAll('.commandItem')[2]);
    expect(onMethodSelected).toHaveBeenCalledWith(METHODS[2], UNIT);
  });
});

describe('fechamento', () => {
  test('Esc volta à lista de Commands, com input vazio, quando aberto pelo Command', async () => {
    setup();
    await openFromCommand();
    await type('sal');
    await press('Escape');
    expect(isOpen()).toBe(true);
    expect(input().value).toBe('');
    expect(items()).toContain('Selecionar Método');
    expect(prefix()).toBeUndefined();
  });

  test('Esc fecha tudo quando aberto pelo menu Edição', async () => {
    setup();
    palette.enterMethodMode(UNIT, { entry: 'direct' });
    await flush();
    await press('Escape');
    expect(isOpen()).toBe(false);
  });

  test('clique fora do card fecha a paleta', async () => {
    setup();
    await openFromCommand();
    await fireEvent.mouseDown(document.querySelector('#commandPaletteOverlay'));
    expect(isOpen()).toBe(false);
  });

  test('menu Edição com a paleta aberta em outro modo troca para Selecionar Método', async () => {
    setup();
    palette.showCommandPalette();
    await tick();
    palette.enterMethodMode(UNIT, { entry: 'direct' });
    await flush();
    expect(prefix()).toBe('Selecionar Método');
  });
});

describe('análise em andamento', () => {
  test('Esc durante a análise e reentrada: a resposta antiga é descartada e a nova aparece sem Analisando', async () => {
    const first = deferred();
    const listUnitMethods = vi.fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(async () => ({ methods: METHODS }));
    setup({ listUnitMethods });
    palette.enterMethodMode(UNIT, { entry: 'direct' });
    await flush();
    await press('Escape');
    expect(isOpen()).toBe(false);

    palette.enterMethodMode(UNIT, { entry: 'direct' });
    await flush();
    expect(empty()).toBeUndefined();
    expect(items()).toEqual(['TCliente.Salvar', 'FormatarCpf', 'TCliente.Carregar']);

    first.resolve({ methods: [{ id: 'velho', label: 'Velho' }] });
    await flush();
    expect(items()).toEqual(['TCliente.Salvar', 'FormatarCpf', 'TCliente.Carregar']);
  });

  test('[PROJECT_REPLACED] é descartado em silêncio', async () => {
    setup({ listUnitMethods: vi.fn(async () => { throw new Error("Error invoking remote method 'methods:list': Error: [PROJECT_REPLACED] x"); }) });
    palette.enterMethodMode(UNIT, { entry: 'direct' });
    await flush();
    expect(window.alert).not.toHaveBeenCalled();
    expect(items()).toEqual([]);
  });

  test('outros erros fecham a paleta e alertam', async () => {
    setup({ listUnitMethods: vi.fn(async () => { throw new Error('[NO_PROJECT] Nenhum Project carregado'); }) });
    palette.enterMethodMode(UNIT, { entry: 'direct' });
    await flush();
    expect(isOpen()).toBe(false);
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('UnitCliente'));
  });

  test('resposta que chega com a paleta já em outro modo é descartada', async () => {
    const pending = deferred();
    setup({ listUnitMethods: vi.fn(() => pending.promise) });
    palette.enterMethodMode(UNIT, { entry: 'direct' });
    await flush();
    palette.enterRootUnitMode([UNIT], '/p', { entry: 'direct' });
    await tick();
    pending.resolve({ methods: METHODS });
    await flush();
    expect(items()).toEqual(['UnitCliente src\\UnitCliente.pas']);
  });
});

describe('prefixo fixo por modo', () => {
  const RECENTS = ['/proj/A.dpr', '/outros/B.dpr'];

  test('lista de Commands não tem prefixo', async () => {
    setup();
    palette.showCommandPalette();
    await tick();
    expect(prefix()).toBeUndefined();
    expect(input().placeholder).toBe('Digite um comando');
  });

  test.each([
    ['direto (menu ou atalho)', async () => palette.showOpenRecent()],
    ['pelo Command Abrir recente', async () => {
      palette.showCommandPalette();
      await tick();
      const button = [...document.querySelectorAll('.commandItem')].find((el) => el.textContent.includes('Abrir recente'));
      await fireEvent.click(button);
    }],
  ])('Abrir recente %s: prefixo fixo e texto de ajuda', async (_, open) => {
    setup();
    api.listRecentProjects = vi.fn(async () => RECENTS);
    await open();
    await flush();
    expect(prefix()).toBe('Abrir recente');
    expect(input().value).toBe('');
    expect(input().placeholder).toBe('Escolha o projeto');
    expect(items().map((t) => t.split(' ')[0])).toEqual(['A.dpr', 'B.dpr']);
    await type('b.dpr');
    expect(prefix()).toBe('Abrir recente');
    expect(input().value).toBe('b.dpr');
  });

  test('Selecionar Unit: texto de ajuda com o input vazio e prefixo mantido ao digitar', async () => {
    setup();
    palette.enterRootUnitMode(
      [{ unitName: 'UnitA', path: 'UnitA.pas' }, { unitName: 'UnitB', path: 'UnitB.pas' }],
      '/p',
      { entry: 'direct' },
    );
    await tick();
    expect(prefix()).toBe('Selecionar Unit');
    expect(input().value).toBe('');
    expect(input().placeholder).toBe('Filtrar por nome ou caminho da unit');
    await type('unitb');
    expect(prefix()).toBe('Selecionar Unit');
    expect(input().value).toBe('unitb');
    expect(items()).toEqual(['UnitB UnitB.pas']);
  });
});
