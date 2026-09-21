export const COMMANDS = [
  {
    id: 'openProject',
    label: 'Abrir projeto (.dpr)',
    shortcut: { mac: '⌘O', other: 'Ctrl+O' },
  },
  {
    id: 'openRecent',
    label: 'Abrir recente',
    shortcut: { mac: '⌘K R', other: 'Ctrl+K R' },
  },
  {
    id: 'selectUnit',
    label: 'Selecionar Unit',
    requiresProject: true,
  },
];

export function availableCommands(commands, { hasProject }) {
  return commands.filter((command) => hasProject || !command.requiresProject);
}

function normalizeForSearch(text) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function filterCommands(commands, text) {
  const needle = normalizeForSearch(text);
  return commands.filter((command) =>
    normalizeForSearch(command.label).includes(needle),
  );
}

export function shortcutHint(command, isMac) {
  if (!command.shortcut) return undefined;
  return isMac ? command.shortcut.mac : command.shortcut.other;
}
