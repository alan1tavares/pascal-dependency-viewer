import { DataSet } from 'vis-data';
import { Network } from 'vis-network';

const api = window.pascalDependencyViewer;

function renderGraph(nodesData, edgesData) {
  document.getElementById('rootUnitSelection').style.display = 'none';
  const container = document.getElementById('mynetwork');
  container.style.display = 'block';

  const nodes = new DataSet(nodesData);
  const edges = new DataSet(edgesData);
  const data = { nodes, edges };

  const arrows = 'to';
  const groups = {
    projectUnit: { shape: 'ellipse', color: '#97C2FC' },
    externalUnit: { shape: 'box', color: '#D3D3D3' },
  };
  const physics = { stabilization: { iterations: 200 } };
  const options = { edges: { arrows }, groups, physics };
  const network = new Network(container, data, options);

  network.once('stabilizationIterationsDone', () => {
    network.setOptions({ physics: false });
  });
}

async function selectRootUnit(projectDir, projectUnit, projectUnits) {
  const scope = document.querySelector('input[name="usesScope"]:checked').value;
  const graph = await api.expandFromRootUnit({ projectDir, projectUnit, projectUnits, scope });
  renderGraph(graph.nodes, graph.edges);
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

function renderRootUnitSelection(projectUnits, projectDir) {
  document.getElementById('mynetwork').style.display = 'none';
  document.getElementById('rootUnitSelection').style.display = 'block';

  const filterInput = document.getElementById('rootUnitFilter');
  filterInput.addEventListener('input', () => {
    renderRootUnitList(projectUnits, projectDir, filterInput.value);
  });

  renderRootUnitList(projectUnits, projectDir, '');
}

api.onGraphLoaded((graph) => renderGraph(graph.nodes, graph.edges));
api.onProjectLoaded(({ projectUnits, projectDir }) => renderRootUnitSelection(projectUnits, projectDir));
