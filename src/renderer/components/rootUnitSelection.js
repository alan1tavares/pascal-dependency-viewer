import { renderGraph } from './graphView.js';

const api = window.pascalDependencyViewer;

async function selectRootUnit(projectDir, projectUnit, projectUnits) {
  const graph = await api.expandFromRootUnit({ projectDir, projectUnit, projectUnits });
  renderGraph(graph.nodes, graph.edges, graph.rootUnitId);
}

function renderRootUnitList(projectUnits, projectDir, filterText) {
  const list = document.getElementById('rootUnitList');
  list.innerHTML = '';

  const filtered = projectUnits.filter(projectUnit =>
    projectUnit.unitName.toLowerCase().includes(filterText.toLowerCase())
  );

  filtered.forEach(projectUnit => {
    const item = document.createElement('li');
    item.textContent = `${projectUnit.unitName} (${projectUnit.path})`;
    item.addEventListener('click', () => selectRootUnit(projectDir, projectUnit, projectUnits));
    list.appendChild(item);
  });
}

export function renderRootUnitSelection(projectUnits, projectDir) {
  document.getElementById('mynetwork').style.display = 'none';
  document.getElementById('viewFilterPanel').style.display = 'none';
  document.getElementById('rootUnitSelection').style.display = 'block';

  const filterInput = document.getElementById('rootUnitFilter');
  filterInput.addEventListener('input', () => {
    renderRootUnitList(projectUnits, projectDir, filterInput.value);
  });

  renderRootUnitList(projectUnits, projectDir, '');
}
