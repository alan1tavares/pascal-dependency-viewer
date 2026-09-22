import { renderGraph } from './graphView.js';
import { filterProjectUnits } from '../../domain/rootUnitSelection/index.js';

const api = window.pascalDependencyViewer;

let allUnits = [];
let filteredUnits = [];
let selectedIndex = 0;
let listenersAttached = false;
let closable = false;
let onRootUnitSelected = null;
let currentProjectDir = null;
let currentProjectUnits = [];

const overlay = () => document.getElementById('rootUnitOverlay');
const input = () => document.getElementById('rootUnitFilter');
const list = () => document.getElementById('rootUnitList');

function closeOverlay() {
  overlay().style.display = 'none';
}

async function selectRootUnit(projectUnit) {
  const graph = await api.expandFromRootUnit({
    projectDir: currentProjectDir,
    projectUnit,
    projectUnits: currentProjectUnits,
  });
  renderGraph(graph.nodes, graph.edges, graph.rootUnitId);
  onRootUnitSelected?.();
  closeOverlay();
}

function renderList() {
  list().innerHTML = '';

  filteredUnits.forEach((projectUnit, index) => {
    const item = document.createElement('li');
    if (index === selectedIndex) item.classList.add('selected');

    item.appendChild(document.createTextNode(projectUnit.unitName));
    const pathLabel = document.createElement('span');
    pathLabel.className = 'secondary';
    pathLabel.textContent = projectUnit.path;
    item.appendChild(pathLabel);

    item.addEventListener('click', () => selectRootUnit(projectUnit));
    list().appendChild(item);
  });

  list().children[selectedIndex]?.scrollIntoView({ block: 'nearest' });
}

function applyFilter() {
  filteredUnits = filterProjectUnits(allUnits, input().value);
  selectedIndex = 0;
  renderList();
}

function moveSelection(delta) {
  if (filteredUnits.length === 0) return;
  selectedIndex = (selectedIndex + delta + filteredUnits.length) % filteredUnits.length;
  renderList();
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
      const projectUnit = filteredUnits[selectedIndex];
      if (projectUnit) selectRootUnit(projectUnit);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (closable) closeOverlay();
    }
  });
  overlay().addEventListener('mousedown', (event) => {
    if (event.target === overlay() && closable) closeOverlay();
  });
}

export function renderRootUnitSelection(
  projectUnits,
  projectDir,
  { closable: isClosable, onRootUnitSelected: onSelected } = {}
) {
  attachListeners();

  allUnits = projectUnits;
  currentProjectUnits = projectUnits;
  currentProjectDir = projectDir;
  closable = Boolean(isClosable);
  onRootUnitSelected = onSelected ?? null;

  input().value = '';
  applyFilter();
  overlay().style.display = 'block';
  input().focus();
}
