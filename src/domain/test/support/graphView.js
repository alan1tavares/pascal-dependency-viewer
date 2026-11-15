// Representações compactas de um Caller Graph para asserções.
const labelOf = (graph) => new Map(graph.nodes.map((n) => [n.id, n.label]));

export function edgeList(graph) {
  const labels = labelOf(graph);
  return graph.edges.map((e) => {
    let text = `${labels.get(e.from)} → ${labels.get(e.to)}`;
    if (e.isPolymorphic) text += ` (via ${e.viaLabel})`;
    if (e.isBackEdge) text += ' [back]';
    return text;
  });
}

export function nodeList(graph) {
  return graph.nodes.map((n) => `${n.label}${n.isTarget ? ' [target]' : ''}${n.isEntryPoint ? ' [entry]' : ''}`);
}

export function idOf(index, label) {
  return [...index.nodes.values()].find((n) => n.label === label).id;
}
