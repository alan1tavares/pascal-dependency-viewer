import { DataSet } from 'vis-data';
import { Network } from 'vis-network';
import 'vis-network/styles/vis-network.css';

const ORIGIN_INTERFACE = 'interface';
const ORIGIN_IMPLEMENTATION = 'implementation';
const ORIGIN_BOTH = 'both';

class NetworkRenderer {
  constructor(containerEl) {
    this.containerEl = containerEl;
    this.networkInstance = null;
    this.visNodes = null;
    this.visEdges = null;
    this.edgeOriginById = new Map();
    this.nodeGroupById = new Map();
    this.currentData = { nodes: [], edges: [], rootUnitId: null };
  }

  initialize() {
    if (!this.containerEl) return;

    this.visNodes = new DataSet([]);
    this.visEdges = new DataSet([]);

    const options = {
      edges: { arrows: 'to' },
      groups: {
        projectUnit: { shape: 'ellipse', color: '#97C2FC' },
        externalUnit: { shape: 'box', color: '#D3D3D3' },
      },
      physics: {
        solver: 'forceAtlas2Based',
        forceAtlas2Based: { avoidOverlap: 1, springLength: 100, centralGravity: 0.05 },
        stabilization: { iterations: 200 },
      },
    };

    this.networkInstance = new Network(
      this.containerEl,
      { nodes: this.visNodes, edges: this.visEdges },
      options
    );

    this.networkInstance.once('stabilizationIterationsDone', () => {
      this.networkInstance.setOptions({ physics: false });
    });
  }

  destroy() {
    if (this.networkInstance) {
      this.networkInstance.destroy();
      this.networkInstance = null;
    }
  }

  renderGraph(nodes, edges, rootUnitId) {
    if (!this.visNodes || !this.visEdges) return;

    this.currentData = { nodes, edges, rootUnitId };
    this.edgeOriginById.clear();
    this.nodeGroupById.clear();

    const edgeList = edges.map(edge => {
      const id = `${edge.from}::${edge.to}`;
      this.edgeOriginById.set(id, edge.origin);
      return {
        id,
        from: edge.from,
        to: edge.to,
      };
    });

    nodes.forEach(node => {
      this.nodeGroupById.set(node.id, node.group);
    });

    this.visNodes.clear();
    this.visNodes.add(nodes);
    this.visEdges.clear();
    this.visEdges.add(edgeList);

    if (this.containerEl) {
      this.containerEl.style.display = 'block';
    }

    this.fitView();
  }

  applyFilter(filterState) {
    if (!this.visNodes || !this.visEdges) return;

    const visibleNodeIds = this.getVisibleNodes(filterState);

    // Garantir que rootUnitId nunca é ocultado
    if (this.currentData.rootUnitId) {
      visibleNodeIds.add(this.currentData.rootUnitId);
    }

    const edgeUpdates = Array.from(this.edgeOriginById, ([id, origin]) => {
      const visible = this.isOriginVisible(origin, filterState) &&
                     visibleNodeIds.has(id.split('::')[1]);
      return { id, hidden: !visible };
    });
    this.visEdges.update(edgeUpdates);

    const nodeUpdates = this.currentData.nodes.map(node => ({
      id: node.id,
      hidden: !visibleNodeIds.has(node.id),
    }));
    this.visNodes.update(nodeUpdates);

    this.fitView();
  }

  getVisibleNodes(filterState) {
    const { interfaceVisible, implementationVisible, externalVisible } = filterState;
    const { rootUnitId } = this.currentData;

    if (!rootUnitId || this.currentData.nodes.length === 0) {
      return new Set();
    }

    const visible = new Set([rootUnitId]);

    for (const [edgeId, origin] of this.edgeOriginById) {
      if (!this.isOriginVisible(origin, filterState)) continue;

      const [from, to] = edgeId.split('::');
      if (this.nodeGroupById.get(to) === 'externalUnit' && !externalVisible) continue;

      visible.add(from);
      visible.add(to);
    }

    return visible;
  }

  isOriginVisible(origin, filterState) {
    const { interfaceVisible, implementationVisible } = filterState;

    if (origin === ORIGIN_BOTH) {
      return interfaceVisible || implementationVisible;
    }
    if (origin === ORIGIN_INTERFACE) {
      return interfaceVisible;
    }
    return implementationVisible;
  }

  fitView() {
    if (this.networkInstance) {
      setTimeout(() => {
        this.networkInstance.fit({ animation: false });
      }, 50);
    }
  }
}

export default NetworkRenderer;
