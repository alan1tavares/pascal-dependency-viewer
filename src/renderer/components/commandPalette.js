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
import { filterProjectUnits } from '../../domain/rootUnitSelection/index.js';
import { renderGraph } from './graphView.js';

const api = window.pascalDependencyViewer;
const isMac = api.platform === 'darwin';

const COMMANDS_MODE = 'commands';
const RECENTS_MODE = 'recents';
const ROOT_UNIT_MODE = 'rootUnit';
const EMPTY_MESSAGES = {
  [COMMANDS_MODE]: 'Nenhum comando encontrado',
  [RECENTS_MODE]: 'Nenhum projeto recente',
  [ROOT_UNIT_MODE]: 'Nenhuma unit encontrada',
};

let hasProject = () => false;
let getProject = () => null;
let onRootUnitSelected = null;
let isOpen = false;
let mode = COMMANDS_MODE;
// Como a paleta chegou ao modo atual (quando não é COMMANDS_MODE): 'palette'
// (por um Command, então `Esc` volta à lista de Commands) ou 'direct'
// (menu/atalho, `Esc` fecha a paleta inteira).
let modeEntry = 'palette';
// Enquanto `false`, `Esc`, o clique fora do card e os atalhos que trocam de
// modo (`Cmd/Ctrl+P`, `Cmd/Ctrl+K R`) não têm efeito algum. Só o modo
// `Selecionar Unit` aberto automaticamente (antes de qualquer Root Unit
// escolhida para o Project atual) fica não-fechável.
let closable = true;
let recentPaths = [];
let rootUnits = [];
let rootUnitProjectDir = null;
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
  getProject = options.getProject;
  onRootUnitSelected = options.onRootUnitSelected;
}

export function closeCommandPalette() {
  isOpen = false;
  closable = true;
  overlay().style.display = 'none';
}

function openRecentProject(filePath) {
  closeCommandPalette();
  api.openRecentProject(filePath);
}

async function selectRootUnit(projectUnit) {
  const graph = await api.expandFromRootUnit({
    projectDir: rootUnitProjectDir,
    projectUnit,
    projectUnits: rootUnits,
  });
  renderGraph(graph.nodes, graph.edges, graph.rootUnitId);
  onRootUnitSelected?.();
  closeCommandPalette();
}

function executeCommand(command) {
  if (command.id === 'openRecent') {
    enterRecentsMode('palette');
    return;
  }
  if (command.id === 'selectUnit') {
    const project = getProject();
    enterRootUnitMode(project.projectUnits, project.projectDir, {
      entry: 'palette',
      closable: true,
    });
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

function renderRootUnitItem(projectUnit) {
  const item = document.createElement('li');
  item.appendChild(document.createTextNode(projectUnit.unitName));

  const pathLabel = document.createElement('span');
  pathLabel.className = 'recentDir';
  pathLabel.textContent = projectUnit.path;
  item.appendChild(pathLabel);

  item.addEventListener('click', () => selectRootUnit(projectUnit));
  return item;
}

function renderItem(entry) {
  if (mode === COMMANDS_MODE) return renderCommandItem(entry);
  if (mode === RECENTS_MODE) return renderRecentItem(entry);
  return renderRootUnitItem(entry);
}

function renderList() {
  list().innerHTML = '';
  emptyMessage().textContent = EMPTY_MESSAGES[mode];
  emptyMessage().style.display = filteredItems.length === 0 ? 'block' : 'none';

  filteredItems.forEach((entry, index) => {
    const item = renderItem(entry);
    if (index === selectedIndex) item.classList.add('selected');
    list().appendChild(item);
  });

  list().children[selectedIndex]?.scrollIntoView({ block: 'nearest' });
}

function applyFilter() {
  if (mode === COMMANDS_MODE) {
    filteredItems = filterCommands(
      availableCommands(COMMANDS, { hasProject: hasProject() }),
      input().value,
    );
  } else if (mode === RECENTS_MODE) {
    filteredItems = filterRecentProjects(recentPaths, input().value);
  } else {
    filteredItems = filterProjectUnits(rootUnits, input().value);
  }
  selectedIndex = 0;
  renderList();
}

function resetInput() {
  input().value = '';
  if (mode === COMMANDS_MODE) {
    input().placeholder = 'Digite um comando';
    prefix().style.display = 'none';
  } else if (mode === RECENTS_MODE) {
    input().placeholder = '';
    prefix().textContent = 'Abrir recente';
    prefix().style.display = '';
  } else {
    input().placeholder = 'Filtrar por nome ou caminho da unit';
    prefix().style.display = 'none';
  }
}

function enterCommandsMode() {
  mode = COMMANDS_MODE;
  closable = true;
  resetInput();
  applyFilter();
  overlay().style.display = 'block';
  input().focus();
}

async function enterRecentsMode(entry) {
  mode = RECENTS_MODE;
  modeEntry = entry;
  closable = true;
  isOpen = true;

  recentPaths = await api.listRecentProjects();
  if (!isOpen || mode !== RECENTS_MODE) return;
  resetInput();
  applyFilter();
  overlay().style.display = 'block';
  input().focus();
}

export function enterRootUnitMode(projectUnits, projectDir, { entry, closable: isClosable } = {}) {
  attachListeners();

  mode = ROOT_UNIT_MODE;
  modeEntry = entry;
  closable = Boolean(isClosable);
  rootUnits = projectUnits;
  rootUnitProjectDir = projectDir;
  isOpen = true;

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
  else if (mode === RECENTS_MODE) openRecentProject(entry);
  else selectRootUnit(entry);
}

function leaveOnEscape() {
  if (!closable) return;
  if (mode !== COMMANDS_MODE && modeEntry === 'palette') enterCommandsMode();
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
    if (!closable) return;
    if (event.target === overlay()) closeCommandPalette();
  });
}

export function showCommandPalette() {
  attachListeners();
  if (!closable) return;
  if (isOpen && mode === COMMANDS_MODE) {
    input().focus();
    return;
  }
  isOpen = true;
  enterCommandsMode();
}

export function showOpenRecent() {
  attachListeners();
  if (!closable) return;
  if (isOpen && mode === RECENTS_MODE) {
    input().focus();
    return;
  }
  return enterRecentsMode('direct');
}
