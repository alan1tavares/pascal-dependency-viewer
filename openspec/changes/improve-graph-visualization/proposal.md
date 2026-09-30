## Why

Hoje o grafo é difícil de explorar. A Root Unit é visualmente igual às
demais Project Units, então some no meio do grafo. As arestas usam o
`smooth` padrão do `vis-network` (`dynamic`, com nós de suporte
invisíveis), e a física é desligada ao fim da estabilização
(`network.setOptions({ physics: false })` em
`src/renderer/components/graphView.js`). Com a física desligada, os nós de
suporte não se reposicionam: ao arrastar um nó, as arestas curvam e as
pontas (origem/destino) não acompanham o nó movido. Além disso, o grafo
fica "morto" depois de estabilizar: arrastar um nó não puxa os vizinhos,
ao contrário do comportamento fluido do Obsidian, que é a referência
desejada. Por fim, a Root Unit não tem posição inicial previsível na tela.

## What Changes

- Destaca a Root Unit: novo `group` `rootUnit` no `vis-network`, com cor
  de destaque, borda mais grossa, tamanho maior e label em negrito. O
  nó da raiz passa a usar esse grupo em vez de `projectUnit`.
- Arestas sempre retas: `edges.smooth: false`, mantendo `arrows: 'to'`
  (a direção `from` → `to` da dependência continua visível). Isso também
  corrige as pontas das arestas não acompanharem o nó movido, já que não
  há mais nós de suporte.
- Física estilo Obsidian: mantém o solver `forceAtlas2Based` sempre
  ligado, com parâmetros ajustados (repulsão forte no lugar do
  `avoidOverlap`, `springLength` maior e `minVelocity` alto para o
  vis-network parar sozinho quando a energia cair). O `physics: false`
  pós-estabilização é removido. Arrastar um nó passa a puxar os vizinhos
  pelas arestas, e o grafo se acomoda ao soltar.
- Root Unit no centro: ao fim da estabilização inicial, a câmera é
  centralizada na Root Unit, com um zoom que enquadra o grafo inteiro ao
  redor dela (uma única vez, na abertura do grafo). A raiz continua
  arrastável como qualquer outro nó.
- Ao alternar o View Filter, a física reacomoda o grafo sozinha, sem
  congelar posições nem reenquadrar a câmera (ela não se move).
- Mantém os formatos atuais dos nós (`ellipse` para Project Unit, `box`
  para External Unit). Não muda o `CONTEXT.md` nem cria ADR: é
  comportamento de exibição.

## Capabilities

### New Capabilities
- `root-unit-highlight`: como a Root Unit é destacada visualmente no grafo
  em relação às demais Project Units e External Units.

### Modified Capabilities
- `dependency-graph-layout`: a física deixa de ser desligada após a
  estabilização (o requisito de disposição orgânica passa a descrever
  simulação contínua, com arrasto que puxa os vizinhos); passa a exigir
  arestas retas com pontas acompanhando os nós; e a Root Unit começa
  centralizada na tela. Também cobre a reacomodação pela física ao
  alternar o View Filter, sem mover a câmera.

## Impact

- Código: `src/renderer/components/graphView.js` (opções de `groups`,
  `edges`, `physics`, centralização da câmera na Root Unit). O
  `rootUnitId` já chega a `renderGraph`, então os dados do domínio
  (`src/domain/**`) e os módulos `main`/`preload` não mudam.
- Specs: delta em `dependency-graph-layout` e nova spec
  `root-unit-highlight`.
- Sem novas dependências. O renderer não é coberto por testes Jest, então
  a verificação é manual no app.
