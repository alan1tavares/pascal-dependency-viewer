# Spec Delta

## MODIFIED Requirements

### Requirement: Disposição orgânica e livre, sem níveis fixos
O sistema SHALL posicionar os nós do Dependency Graph por equilíbrio de
forças (física), sem organizá-los em níveis, colunas ou grade fixa, e
SHALL permitir que o usuário reposicione qualquer nó livremente por
arraste. Ao soltar o nó, o sistema SHALL liberá-lo de volta à
disposição por física, permitindo que a simulação o reposicione como
qualquer outro nó — o nó não permanece fixo indefinidamente na posição
em que foi solto.

#### Scenario: Grafo com dependências transitivas não fica organizado em colunas fixas
- **WHEN** o grafo é renderizado com uma cadeia de dependências
  transitivas (`UnitA -> UnitB -> UnitC`)
- **THEN** as posições finais dos nós não seguem uma grade ou sequência
  fixa de colunas — a disposição resulta do equilíbrio de forças entre
  os nós e arestas

#### Scenario: Usuário arrasta um nó já estabilizado
- **WHEN** o grafo já estabilizou e o usuário arrasta um nó para uma
  nova posição e solta o mouse
- **THEN** o nó é liberado de volta à disposição por física ao ser
  solto, podendo ser reposicionado pela simulação de forças — a
  posição em que o mouse foi solto não é permanente
