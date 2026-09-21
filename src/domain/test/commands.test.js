import {
  COMMANDS,
  availableCommands,
  filterCommands,
  shortcutHint,
} from '../commands/index.js';

const labels = (commands) => commands.map((command) => command.label);

test('o catálogo tem Abrir projeto (.dpr), Abrir recente e Selecionar Unit, nesta ordem', () => {
  expect(COMMANDS.map((command) => command.id)).toEqual([
    'openProject',
    'openRecent',
    'selectUnit',
  ]);
  expect(labels(COMMANDS)).toEqual([
    'Abrir projeto (.dpr)',
    'Abrir recente',
    'Selecionar Unit',
  ]);
});

test('Selecionar Método e Sair não são Commands', () => {
  expect(labels(COMMANDS)).not.toContain('Selecionar Método');
  expect(labels(COMMANDS)).not.toContain('Sair');
});

test('omite Selecionar Unit quando nenhum Project foi aberto', () => {
  expect(labels(availableCommands(COMMANDS, { hasProject: false }))).toEqual([
    'Abrir projeto (.dpr)',
    'Abrir recente',
  ]);
});

test('lista os três Commands, nesta ordem, quando há Project aberto', () => {
  expect(labels(availableCommands(COMMANDS, { hasProject: true }))).toEqual([
    'Abrir projeto (.dpr)',
    'Abrir recente',
    'Selecionar Unit',
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
