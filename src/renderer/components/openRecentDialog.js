import {
  describeRecentProject,
  filterRecentProjects,
} from '../../domain/recentProjects/index.js';

const api = window.pascalDependencyViewer;

let isOpen = false;
let allPaths = [];
let filteredPaths = [];
let selectedIndex = 0;
let listenersAttached = false;

const overlay = () => document.getElementById('openRecentOverlay');
const input = () => document.getElementById('openRecentInput');
const list = () => document.getElementById('openRecentList');
const emptyMessage = () => document.getElementById('openRecentEmpty');

function closeDialog() {
  isOpen = false;
  overlay().style.display = 'none';
}

function openRecentProject(filePath) {
  closeDialog();
  api.openRecentProject(filePath);
}

function renderList() {
  list().innerHTML = '';
  emptyMessage().style.display = filteredPaths.length === 0 ? 'block' : 'none';

  filteredPaths.forEach((filePath, index) => {
    const { fileName, dir } = describeRecentProject(filePath);
    const item = document.createElement('li');
    if (index === selectedIndex) item.classList.add('selected');

    item.appendChild(document.createTextNode(fileName));
    const dirLabel = document.createElement('span');
    dirLabel.className = 'recentDir';
    dirLabel.textContent = dir;
    item.appendChild(dirLabel);

    item.addEventListener('click', () => openRecentProject(filePath));
    list().appendChild(item);
  });

  list().children[selectedIndex]?.scrollIntoView({ block: 'nearest' });
}

function applyFilter() {
  filteredPaths = filterRecentProjects(allPaths, input().value);
  selectedIndex = 0;
  renderList();
}

function moveSelection(delta) {
  if (filteredPaths.length === 0) return;
  selectedIndex = (selectedIndex + delta + filteredPaths.length) % filteredPaths.length;
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
      const filePath = filteredPaths[selectedIndex];
      if (filePath) openRecentProject(filePath);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
    }
  });
  overlay().addEventListener('mousedown', (event) => {
    if (event.target === overlay()) closeDialog();
  });
}

export async function showOpenRecentDialog() {
  attachListeners();
  if (isOpen) {
    input().focus();
    return;
  }
  isOpen = true;

  allPaths = await api.listRecentProjects();
  input().value = '';
  applyFilter();
  overlay().style.display = 'block';
  input().focus();
}
