import { DataSet } from 'vis-data';
import { Network } from 'vis-network';

export function renderGraph(nodesData, edgesData) {
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
