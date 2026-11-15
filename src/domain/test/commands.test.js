import {
  COMMANDS,
  availableCommands,
  filterCommands,
  shortcutHint,
} from '../commands/index.js';

const labels = (commands) => commands.map((command) => command.label);

test('o catálogo tem Abrir projeto (.dpr), Abrir recente, Selecionar Unit, Selecionar Método e Bem-vindo, nesta ordem', () => {
  expect(COMMANDS.map((command) => command.id)).toEqual([
    'openProject',
    'openRecent',
    'selectUnit',
    'selectMethod',
    'showWelcome',
  ]);
  expect(labels(COMMANDS)).toEqual([
    'Abrir projeto (.dpr)',
    'Abrir recente',
    'Selecionar Unit',
    'Selecionar Método',
    'Bem-vindo',
  ]);
});

test('Sair não é Command', () => {
  expect(labels(COMMANDS)).not.toContain('Sair');
});

test('Selecionar Método não tem atalho', () => {
  const selectMethod = COMMANDS.find((command) => command.id === 'selectMethod');
  expect(shortcutHint(selectMethod, true)).toBeUndefined();
  expect(shortcutHint(selectMethod, false)).toBeUndefined();
});

test('Selecionar Método só aparece com uma Unit Tab ativa', () => {
  const withTab = (activeTabKind) => labels(availableCommands(COMMANDS, { hasProject: true, activeTabKind }));
  expect(withTab('unit')).toEqual([
    'Abrir projeto (.dpr)',
    'Abrir recente',
    'Selecionar Unit',
    'Selecionar Método',
    'Bem-vindo',
  ]);
  expect(withTab('welcome')).not.toContain('Selecionar Método');
  expect(withTab('method')).not.toContain('Selecionar Método');
});

test('omite Selecionar Unit quando nenhum Project foi aberto', () => {
  expect(labels(availableCommands(COMMANDS, { hasProject: false, activeTabKind: 'welcome' }))).toEqual([
    'Abrir projeto (.dpr)',
    'Abrir recente',
    'Bem-vindo',
  ]);
});

test('lista os quatro Commands, nesta ordem, quando há Project aberto', () => {
  expect(labels(availableCommands(COMMANDS, { hasProject: true, activeTabKind: 'welcome' }))).toEqual([
    'Abrir projeto (.dpr)',
    'Abrir recente',
    'Selecionar Unit',
    'Bem-vindo',
  ]);
});

test('filtra por parte do rótulo', () => {
  expect(labels(filterCommands(COMMANDS, 'recen'))).toEqual(['Abrir recente']);
});

test('o filtro não diferencia maiúsculas de minúsculas', () => {
  expect(labels(filterCommands(COMMANDS, 'PROJETO'))).toEqual(['Abrir projeto (.dpr)']);
});

test('o filtro ignora acentos nos dois lados', () => {
  const commands = [{ id: 'edit', label: 'Edição' }, { id: 'plain', label: 'Abrir' }];

  expect(labels(filterCommands(commands, 'edicao'))).toEqual(['Edição']);
  expect(labels(filterCommands(commands, 'EDIÇÃO'))).toEqual(['Edição']);
  expect(labels(filterCommands(commands, 'ábrir'))).toEqual(['Abrir']);
});

test('o filtro preserva a ordem do catálogo', () => {
  expect(labels(filterCommands(COMMANDS, 'abrir'))).toEqual([
    'Abrir projeto (.dpr)',
    'Abrir recente',
  ]);
});

test('texto vazio devolve todos os Commands', () => {
  expect(filterCommands(COMMANDS, '')).toEqual(COMMANDS);
});

test('filtro sem resultado devolve lista vazia', () => {
  expect(filterCommands(COMMANDS, 'xyz')).toEqual([]);
});

test('dicas de atalho no macOS', () => {
  const [openProject, openRecent] = COMMANDS;

  expect(shortcutHint(openProject, true)).toBe('⌘O');
  expect(shortcutHint(openRecent, true)).toBe('⌘K R');
});

test('dicas de atalho no Linux', () => {
  const [openProject, openRecent] = COMMANDS;

  expect(shortcutHint(openProject, false)).toBe('Ctrl+O');
  expect(shortcutHint(openRecent, false)).toBe('Ctrl+K R');
});

test('Selecionar Unit não tem dica de atalho', () => {
  const selectUnit = COMMANDS.find((command) => command.id === 'selectUnit');

  expect(shortcutHint(selectUnit, true)).toBeUndefined();
  expect(shortcutHint(selectUnit, false)).toBeUndefined();
});
