// Camadas do Caller Graph para o layout de baixo para cima (design 6): o
// Target Method fica no nível 0 e cada Caller fica acima de todos os Methods
// que chama dentro do grafo — o caminho mais longo até o Target Method —,
// ignorando back-edges e self-loops, que fechariam ciclos.
//
// Devolve `Map<idDoNó, nível>`.
export function assignCallerLevels(graph) {
  const callees = new Map(graph.nodes.map((node) => [node.id, []]));
  for (const edge of graph.edges) {
    if (edge.isBackEdge || edge.from === edge.to) continue;
    callees.get(edge.from)?.push(edge.to);
  }

  const levels = new Map();
  // Pós-ordem iterativa: sem as back-edges o grafo é acíclico.
  for (const node of graph.nodes) {
    if (levels.has(node.id)) continue;
    const stack = [{ id: node.id, next: 0 }];
    const onStack = new Set([node.id]);
    while (stack.length) {
      const frame = stack[stack.length - 1];
      const list = callees.get(frame.id) || [];
      if (frame.next < list.length) {
        const callee = list[frame.next++];
        if (!levels.has(callee) && !onStack.has(callee)) {
          onStack.add(callee);
          stack.push({ id: callee, next: 0 });
        }
        continue;
      }
      let level = 0;
      for (const callee of list) {
        if (levels.has(callee)) level = Math.max(level, levels.get(callee) + 1);
      }
      levels.set(frame.id, level);
      onStack.delete(frame.id);
      stack.pop();
    }
  }
  return levels;
}
