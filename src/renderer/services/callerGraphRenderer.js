// Desenho do Caller Graph de uma Method Tab com vis-network (design 6):
// layout hierárquico de baixo para cima (Target Method na base), sem física,
// sem View Filter e sem ações de clique.
import { DataSet } from 'vis-data';
import { Network } from 'vis-network';
import 'vis-network/styles/vis-network.css';
import { assignCallerLevels } from '../../domain/callerLevels/index.js';

const ENTRY_POINT_COLOR = { background: '#FFD27F', border: '#C98A00', highlight: { background: '#FFE0A3', border: '#C98A00' } };
const POLYMORPHIC_COLOR = '#8E44AD';

export const CALLER_GRAPH_GROUPS = {
  target: {
    shape: 'box',
    color: { background: '#FF6B4A', border: '#B3260A', highlight: { background: '#FF8A70', border: '#B3260A' } },
    borderWidth: 3,
    font: { color: '#FFFFFF', bold: true },
  },
  entryPoint: { shape: 'ellipse', color: ENTRY_POINT_COLOR, borderWidth: 2 },
  block: { shape: 'box', shapeProperties: { borderDashes: [4, 3] }, color: ENTRY_POINT_COLOR, borderWidth: 2 },
  method: { shape: 'ellipse', color: { background: '#E8EEF5', border: '#7A8CA3', highlight: { background: '#F2F6FA', border: '#7A8CA3' } } },
};

// Grupo visual de um nó, nesta precedência (design 6): Target Method, bloco
// especial (não-Method), Entry Point e, por fim, Method comum.
export function nodeGroup(node) {
  if (node.isTarget) return 'target';
  if (node.kind !== 'method') return 'block';
  if (node.isEntryPoint) return 'entryPoint';
  return 'method';
}

export function toVisData(graph) {
  const levels = assignCallerLevels(graph);
  const nodes = graph.nodes.map((node) => ({
    id: node.id,
    label: node.kind === 'method' ? `${node.label}\n${node.unitName}` : node.label,
    group: nodeGroup(node),
    level: levels.get(node.id) ?? 0,
  }));
  const edges = graph.edges.map((edge) => {
    const visEdge = { id: `${edge.from}->${edge.to}`, from: edge.from, to: edge.to, dashes: edge.isBackEdge };
    // A back-edge costuma ter uma aresta no sentido oposto entre os mesmos
    // nós; curvada, ela não fica escondida sob a outra.
    if (edge.isBackEdge) visEdge.smooth = { enabled: true, type: 'curvedCW', roundness: 0.35 };
    if (edge.isPolymorphic) {
      visEdge.color = { color: POLYMORPHIC_COLOR, highlight: POLYMORPHIC_COLOR, hover: POLYMORPHIC_COLOR };
      visEdge.title = `via ${edge.viaLabel}`;
    }
    return visEdge;
  });
  return { nodes, edges };
}

export const CALLER_GRAPH_OPTIONS = {
  layout: {
    hierarchical: {
      enabled: true,
      direction: 'DU',
      sortMethod: 'directed',
      shakeTowards: 'leaves',
      levelSeparation: 110,
      nodeSpacing: 220,
    },
  },
  physics: false,
  groups: CALLER_GRAPH_GROUPS,
  nodes: { font: { multi: false, size: 13 }, margin: 8 },
  edges: {
    arrows: 'to',
    color: { color: '#5A6B80', highlight: '#2C3E50' },
    smooth: { enabled: true, type: 'cubicBezier', forceDirection: 'vertical', roundness: 0.4 },
    selfReference: { size: 24, angle: Math.PI / 4 },
  },
  interaction: { hover: true, dragNodes: true, dragView: true, zoomView: true },
};

export default class CallerGraphRenderer {
  constructor(containerEl) {
    this.containerEl = containerEl;
    this.network = null;
  }

  render(graph) {
    if (!this.containerEl) return;
    const { nodes, edges } = toVisData(graph);
    this.network = new Network(
      this.containerEl,
      { nodes: new DataSet(nodes), edges: new DataSet(edges) },
      CALLER_GRAPH_OPTIONS,
    );
    // Enquadra o grafo inteiro (com o Target Method) na primeira exibição.
    this.network.fit();
  }

  destroy() {
    if (this.network) {
      this.network.destroy();
      this.network = null;
    }
  }
}
