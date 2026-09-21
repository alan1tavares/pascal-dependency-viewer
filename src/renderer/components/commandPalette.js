import {
  COMMANDS,
  availableCommands,
  filterCommands,
  shortcutHint,
} from '../../domain/commands/index.js';
import {
  describeRecentProject,
  filterRecentProjects,
} from '../../domain/recentProjects/index.js';

const api = window.pascalDependencyViewer;
const isMac = api.platform === 'darwin';

const COMMANDS_MODE = 'commands';
const RECENTS_MODE = 'recents';
const EMPTY_MESSAGES = {
  [COMMANDS_MODE]: 'Nenhum comando encontrado',
  [RECENTS_MODE]: 'Nenhum projeto recente',
};

let hasProject = () => false;
let isOpen = false;
let mode = COMMANDS_MODE;
// Como a paleta chegou ao modo recentes: 'palette' (pelo Command `Abrir recente`,
// então `Esc` volta à lista de Commands) ou 'direct' (menu/atalho, `Esc` fecha).
let recentsEntry = 'palette';
let recentPaths = [];
let filteredItems = [];
let selectedIndex = 0;
let listenersAttached = false;

const overlay = () => document.getElementById('commandPaletteOverlay');
const input = () => document.getElementById('commandPaletteInput');
const prefix = () => document.getElementById('commandPalettePrefix');
const list = () => document.getElementById('commandPaletteList');
const emptyMessage = () => document.getElementById('commandPaletteEmpty');

export function configureCommandPalette(options) {
  hasProject = options.hasProject;
}

export function closeCommandPalette() {
  isOpen = false;
  overlay().style.display = 'none';
}

function openRecentProject(filePath) {
  closeCommandPalette();
  api.openRecentProject(filePath);
}

function executeCommand(command) {
  if (command.id === 'openRecent') {
    enterRecentsMode('palette');
    return;
  }
  closeCommandPalette();
  api.runCommand(command.id);
}

function renderCommandItem(command) {
  const item = document.createElement('li');
  item.classList.add('commandItem');
  item.appendChild(document.createTextNode(command.label));

  const hint = shortcutHint(command, isMac);
  if (hint) {
    const hintLabel = document.createElement('span');
    hintLabel.className = 'commandHint';
    hintLabel.textContent = hint;
    item.appendChild(hintLabel);
  }

  item.addEventListener('click', () => executeCommand(command));
  return item;
}

function renderRecentItem(filePath) {
  const { fileName, dir } = describeRecentProject(filePath);
  const item = document.createElement('li');
  item.appendChild(document.createTextNode(fileName));

  const dirLabel = document.createElement('span');
  dirLabel.className = 'recentDir';
  dirLabel.textContent = dir;
  item.appendChild(dirLabel);

  item.addEventListener('click', () => openRecentProject(filePath));
  return item;
}

function renderList() {
  list().innerHTML = '';
  emptyMessage().textContent = EMPTY_MESSAGES[mode];
  emptyMessage().style.display = filteredItems.length === 0 ? 'block' : 'none';

  filteredItems.forEach((entry, index) => {
    const item =
      mode === COMMANDS_MODE ? renderCommandItem(entry) : renderRecentItem(entry);
    if (index === selectedIndex) item.classList.add('selected');
    list().appendChild(item);
  });

  list().children[selectedIndex]?.scrollIntoView({ block: 'nearest' });
}

function applyFilter() {
  filteredItems =
    mode === COMMANDS_MODE
      ? filterCommands(
          availableCommands(COMMANDS, { hasProject: hasProject() }),
          input().value,
        )
      : filterRecentProjects(recentPaths, input().value);
  selectedIndex = 0;
  renderList();
}

function resetInput() {
  input().value = '';
  input().placeholder = mode === COMMANDS_MODE ? 'Digite um comando' : '';
  prefix().style.display = mode === COMMANDS_MODE ? 'none' : '';
}

function enterCommandsMode() {
  mode = COMMANDS_MODE;
  resetInput();
  applyFilter();
  overlay().style.display = 'block';
  input().focus();
}

async function enterRecentsMode(entry) {
  mode = RECENTS_MODE;
  recentsEntry = entry;
  isOpen = true;

  recentPaths = await api.listRecentProjects();
  if (!isOpen || mode !== RECENTS_MODE) return;
  resetInput();
  applyFilter();
  overlay().style.display = 'block';
  input().focus();
}

function moveSelection(delta) {
  if (filteredItems.length === 0) return;
  selectedIndex = (selectedIndex + delta + filteredItems.length) % filteredItems.length;
  renderList();
}

function confirmSelection() {
  const entry = filteredItems[selectedIndex];
  if (!entry) return;
  if (mode === COMMANDS_MODE) executeCommand(entry);
  else openRecentProject(entry);
}

function leaveOnEscape() {
  if (mode === RECENTS_MODE && recentsEntry === 'palette') enterCommandsMode();
  else closeCommandPalette();
}

function attachListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  input().addEventListener('input', applyFilter);
  input().addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveSelection(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveSelection(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      confirmSelection();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      leaveOnEscape();
    }
  });
  overlay().addEventListener('mousedown', (event) => {
    if (event.target === overlay()) closeCommandPalette();
  });
}

export function showCommandPalette() {
  attachListeners();
  if (isOpen && mode === COMMANDS_MODE) {
    input().focus();
    return;
  }
  isOpen = true;
  enterCommandsMode();
}

export function showOpenRecent() {
  attachListeners();
  if (isOpen && mode === RECENTS_MODE) {
    input().focus();
    return;
  }
  return enterRecentsMode('direct');
}
