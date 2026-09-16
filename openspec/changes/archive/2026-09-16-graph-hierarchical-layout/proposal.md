## Why

O grafo renderizado por `vis-network` usa hoje apenas física livre
(`physics.stabilization`, solver padrão `barnesHut`, sem `avoidOverlap`
configurado) para posicionar os nós, e desliga a física assim que a
estabilização termina. Isso não garante espaçamento mínimo entre nós: em
grafos com bastante fan-out (uma unit usada por muitas outras, ou muitas
External Units concentradas ao redor de poucas Project Units) alguns nós
acabam convergindo para posições muito próximas ou coincidentes,
tornando o grafo difícil de ler.

Uma primeira tentativa trocou a disposição para um layout hierárquico
(nós organizados em níveis/colunas por distância da Root Unit), que de
fato elimina a sobreposição de nós. Porém, testes manuais mostraram que
essa disposição em colunas rígidas gera um número grande de arestas se
cruzando — especialmente em nós com fan-in/fan-out alto e em ciclos
diretos, cuja aresta "de volta" precisa cruzar vários níveis — tornando
o grafo tão confuso quanto (ou mais que) o problema original de
sobreposição de nós. A solução mais adequada é manter a disposição
orgânica (nós posicionados por equilíbrio de forças, como um mapa, sem
níveis fixos), mas ajustar a física para garantir espaçamento mínimo
entre nós.

## What Changes

- Mantém o grafo com disposição orgânica (força livre, sem
  `layout.hierarchical`) — os nós continuam se posicionando por
  equilíbrio de forças, sem colunas ou níveis fixos, e continuam
  livremente arrastáveis pelo usuário.
- Troca o solver de física de `barnesHut` (implícito, padrão do
  `vis-network`) para `forceAtlas2Based`, que tende a espalhar melhor
  grafos com nós de alta conectividade (fan-in/fan-out), reduzindo
  aglomeração e cruzamento de arestas em comparação ao `barnesHut`.
- Ativa `avoidOverlap` no solver escolhido, garantindo espaçamento
  mínimo entre nós proporcional ao tamanho de cada um — independente de
  quantos nós existam na vizinhança ou se fazem parte de um ciclo direto.
- Mantém o `network.once('stabilizationIterationsDone', ...)` que
  desliga a física ao final da estabilização, como já acontece hoje.
- Não muda a lógica de dados do grafo (`nodesData`/`edgesData`,
  `group`, `origin`) nem o comportamento do View Filter — ambos operam
  sobre a mesma estrutura, só os parâmetros de física mudam.

## Capabilities

### New Capabilities

- `dependency-graph-layout`: define como os nós e arestas do Dependency
  Graph são posicionados visualmente no canvas do `vis-network`
  (disposição orgânica por física, com espaçamento mínimo garantido
  entre nós).

### Modified Capabilities

(nenhuma — `graph-canvas-layout` continua tratando só do
dimensionamento do container à janela; esta mudança não altera esse
comportamento)

## Impact

- `src/renderer/components/graphView.js` (`renderGraph`): troca as
  opções de `physics` (solver `forceAtlas2Based` com `avoidOverlap`),
  removendo qualquer configuração de `layout.hierarchical`, e mantendo
  o `network.once('stabilizationIterationsDone', ...)` que desliga a
  física ao final.
- Sem mudança em `src/domain/**` — a expansão do grafo e a classificação
  de External Unit continuam produzindo a mesma estrutura `{ nodes, edges }`.
- Sem mudança em `src/main/**`/`src/preload/**` — a mudança é isolada à
  renderização.
