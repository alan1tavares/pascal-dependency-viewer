import { DataSet } from 'vis-data';
import { Network } from 'vis-network';

const ORIGIN_INTERFACE = 'interface';
const ORIGIN_IMPLEMENTATION = 'implementation';
const ORIGIN_BOTH = 'both';

export function renderGraph(nodesData, edgesData, rootUnitId) {
  document.getElementById('rootUnitSelection').style.display = 'none';
  const container = document.getElementById('mynetwork');
  container.style.display = 'block';
  document.getElementById('viewFilterPanel').style.display = 'block';

  const edgeOriginById = new Map();
  const edgesWithId = edgesData.map(edge => {
    const id = `${edge.from}::${edge.to}`;
    edgeOriginById.set(id, edge.origin);
    return { id, from: edge.from, to: edge.to };
  });

  const nodes = new DataSet(nodesData);
  const edges = new DataSet(edgesWithId);
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

  setUpViewFilter({ nodes, edges, nodesData, edgeOriginById, rootUnitId });
}

function setUpViewFilter({ nodes, edges, nodesData, edgeOriginById, rootUnitId }) {
  const interfaceCheckbox = document.getElementById('viewFilterInterface');
  const implementationCheckbox = document.getElementById('viewFilterImplementation');
  const externalCheckbox = document.getElementById('viewFilterExternal');
  interfaceCheckbox.checked = true;
  implementationCheckbox.checked = true;
  externalCheckbox.checked = false;

  const nodeGroupById = new Map(nodesData.map(node => [node.id, node.group]));

  function isOriginVisible(origin) {
    if (origin === ORIGIN_BOTH) {
      return interfaceCheckbox.checked || implementationCheckbox.checked;
    }
    if (origin === ORIGIN_INTERFACE) {
      return interfaceCheckbox.checked;
    }
    return implementationCheckbox.checked;
  }

  function isEdgeVisible(id, origin) {
    if (!isOriginVisible(origin)) {
      return false;
    }
    const [, to] = id.split('::');
    if (nodeGroupById.get(to) === 'externalUnit' && !externalCheckbox.checked) {
      return false;
    }
    return true;
  }

  function applyViewFilter() {
    const visibleNodeIds = new Set([rootUnitId]);

    const edgeUpdates = Array.from(edgeOriginById, ([id, origin]) => {
      const visible = isEdgeVisible(id, origin);
      if (visible) {
        const [from, to] = id.split('::');
        visibleNodeIds.add(from);
        visibleNodeIds.add(to);
      }
      return { id, hidden: !visible };
    });
    edges.update(edgeUpdates);

    const nodeUpdates = nodesData.map(node => ({
      id: node.id,
      hidden: !visibleNodeIds.has(node.id),
    }));
    nodes.update(nodeUpdates);
  }

  function handleCheckboxChange(event) {
    if (!interfaceCheckbox.checked && !implementationCheckbox.checked) {
      event.target.checked = true;
      return;
    }
    applyViewFilter();
  }

  interfaceCheckbox.onchange = handleCheckboxChange;
  implementationCheckbox.onchange = handleCheckboxChange;
  externalCheckbox.onchange = applyViewFilter;

  applyViewFilter();
}
