// Expansão do Caller Graph de um Target Method (spec `caller-graph-expansion`).
//
// Busca em profundidade a partir do Target Method, subindo pelos Callers na
// ordem do índice (Units na ordem do .dpr, depois a ordem no fonte). Cada
// Method/bloco vira um único nó; a aresta vai do Caller para o chamado. Uma
// aresta que chega a um nó ainda na pilha da travessia é back-edge; um
// self-loop (`from === to`) nunca é back-edge. Entre o mesmo par há no
// máximo uma aresta, e a chamada direta prevalece sobre a polimórfica.

export class MethodNotFoundError extends Error {
  constructor(id) {
    super(`Method não encontrado: ${id}`);
    this.name = 'MethodNotFoundError';
    this.code = 'METHOD_NOT_FOUND';
  }
}

// Callers de `id` agrupados por Caller, na ordem da primeira ocorrência.
function groupedCallers(index, id) {
  const groups = new Map();
  for (const ref of index.callers.get(id) || []) {
    const group = groups.get(ref.callerId);
    if (!group) {
      groups.set(ref.callerId, { ...ref });
    } else if (group.kind === 'polymorphic' && ref.kind === 'direct') {
      groups.set(ref.callerId, { callerId: ref.callerId, kind: 'direct' });
    }
  }
  return [...groups.values()];
}

export default function expandCallerGraph(index, targetId) {
  const target = index.nodes.get(targetId);
  if (!target || target.kind !== 'method') throw new MethodNotFoundError(targetId);

  const nodes = [];
  const edges = [];
  const added = new Set();
  const onStack = new Set();

  const addNode = (id) => {
    if (added.has(id)) return;
    added.add(id);
    const info = index.nodes.get(id);
    nodes.push({
      id,
      label: info.label,
      unitName: info.unitName,
      kind: info.kind,
      isTarget: id === targetId,
      isEntryPoint: index.entryPoints.has(id),
    });
  };

  // Pilha explícita para não estourar a pilha do JS em cadeias longas.
  addNode(targetId);
  onStack.add(targetId);
  const stack = [{ id: targetId, callers: groupedCallers(index, targetId), next: 0 }];
  while (stack.length) {
    const frame = stack[stack.length - 1];
    if (frame.next >= frame.callers.length) {
      onStack.delete(frame.id);
      stack.pop();
      continue;
    }
    const ref = frame.callers[frame.next++];
    const from = ref.callerId;
    const isSelfLoop = from === frame.id;
    const edge = { from, to: frame.id, isBackEdge: !isSelfLoop && onStack.has(from), isPolymorphic: ref.kind === 'polymorphic' };
    if (edge.isPolymorphic) {
      edge.viaId = ref.viaId;
      edge.viaLabel = ref.viaLabel;
    }
    const firstVisit = !added.has(from);
    addNode(from);
    edges.push(edge);
    if (firstVisit) {
      onStack.add(from);
      stack.push({ id: from, callers: groupedCallers(index, from), next: 0 });
    }
  }

  return { nodes, edges, skippedUnits: index.skippedUnits.map(({ unitName, reason }) => ({ unitName, reason })) };
}
