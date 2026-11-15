import { matchesSearch } from '../search/index.js';

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
  {
    id: 'selectMethod',
    label: 'Selecionar Método',
    requiresActiveTabKind: 'unit',
  },
  {
    id: 'showWelcome',
    label: 'Bem-vindo',
  },
];

// `activeTabKind`: tipo da Tab ativa quando a paleta é aberta
// (`welcome`, `unit` ou `method`).
export function availableCommands(commands, { hasProject, activeTabKind }) {
  return commands.filter(
    (command) =>
      (hasProject || !command.requiresProject) &&
      (!command.requiresActiveTabKind || command.requiresActiveTabKind === activeTabKind),
  );
}

export function filterCommands(commands, text) {
  return commands.filter((command) => matchesSearch(command.label, text));
}

export function shortcutHint(command, isMac) {
  if (!command.shortcut) return undefined;
  return isMac ? command.shortcut.mac : command.shortcut.other;
}
