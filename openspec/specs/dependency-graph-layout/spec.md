# dependency-graph-layout

## Purpose

Definir como os nós e arestas do Dependency Graph são posicionados
visualmente no canvas do `vis-network`, garantindo espaçamento mínimo
entre nós numa disposição orgânica (tipo mapa), sem organizar o grafo em
níveis ou colunas fixas.

## Requirements

### Requirement: Nenhum nó fica sobreposto a outro
O sistema SHALL garantir espaçamento mínimo entre quaisquer dois nós do
Dependency Graph, proporcional ao tamanho de cada nó, de forma que
nenhum nó fique sobreposto a outro — independentemente de quantos nós
existam na vizinhança ou de haver dependências cíclicas diretas entre
eles.

#### Scenario: Muitos nós conectados à mesma dependência comum não se sobrepõem
- **WHEN** o grafo tem várias Project Units ou External Units distintas
  que usam a mesma dependência comum (fan-out alto para um único nó)
- **THEN** cada um desses nós é exibido em uma posição distinta, sem
  sobreposição visual entre eles

#### Scenario: Ciclo direto entre duas Project Units não causa sobreposição
- **WHEN** a Root Unit `UnitA` tem `uses UnitB`, e `UnitB` tem `uses
  UnitA` de volta
- **THEN** `UnitA` e `UnitB` são exibidos em posições distintas, sem
  sobreposição entre si

### Requirement: Disposição orgânica e livre, sem níveis fixos
O sistema SHALL posicionar os nós do Dependency Graph por equilíbrio de
forças (física), sem organizá-los em níveis, colunas ou grade fixa, e
SHALL permitir que o usuário reposicione qualquer nó livremente por
arraste após a estabilização inicial, sem que o nó seja realinhado
automaticamente a uma posição fixa.

#### Scenario: Grafo com dependências transitivas não fica organizado em colunas fixas
- **WHEN** o grafo é renderizado com uma cadeia de dependências
  transitivas (`UnitA -> UnitB -> UnitC`)
- **THEN** as posições finais dos nós não seguem uma grade ou sequência
  fixa de colunas — a disposição resulta do equilíbrio de forças entre
  os nós e arestas

#### Scenario: Usuário arrasta um nó já estabilizado
- **WHEN** o grafo já estabilizou e o usuário arrasta um nó para uma
  nova posição
- **THEN** o nó permanece na posição escolhida pelo usuário, sem ser
  realinhado automaticamente a uma posição anterior
