## Purpose

Definir como a Root Unit é destacada visualmente no grafo, para que o
usuário a localize de imediato entre as demais Project Units e External
Units do Dependency Graph.

## ADDED Requirements

### Requirement: A Root Unit tem estilo visual próprio e destacado
O sistema SHALL exibir o nó da Root Unit com um estilo visual distinto de
qualquer outro nó do grafo — cor de destaque diferente da usada para
Project Units e External Units, borda mais grossa, tamanho maior e label
em negrito — de modo que ela seja identificável sem depender da sua
posição na tela. O formato do nó (elipse) SHALL permanecer o mesmo das
demais Project Units.

#### Scenario: Root Unit se distingue das Project Units
- **WHEN** o grafo é renderizado com a Root Unit `UnitA`, que usa a
  Project Unit `UnitB`
- **THEN** o nó de `UnitA` é exibido com cor, borda, tamanho e label
  distintos e mais proeminentes do que os do nó de `UnitB`

#### Scenario: Root Unit se distingue das External Units
- **WHEN** o grafo é renderizado com External Units visíveis
- **THEN** o nó da Root Unit tem cor de destaque diferente da cor das
  External Units, além de borda e tamanho maiores

### Requirement: O destaque da Root Unit independe do View Filter
O sistema SHALL manter o destaque da Root Unit em qualquer estado do View
Filter, inclusive quando a Root Unit permanece visível sem nenhuma aresta
visível.

#### Scenario: Root Unit isolada continua destacada
- **WHEN** o usuário desmarca uma origem no View Filter e a Root Unit
  fica sem nenhuma aresta visível
- **THEN** o nó da Root Unit continua exibido com o mesmo estilo
  destacado
