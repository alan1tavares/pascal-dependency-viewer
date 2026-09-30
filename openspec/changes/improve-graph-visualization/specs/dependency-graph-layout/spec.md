## MODIFIED Requirements

### Requirement: Disposição orgânica e livre, sem níveis fixos
O sistema SHALL posicionar os nós do Dependency Graph por equilíbrio de
forças (física), sem organizá-los em níveis, colunas ou grade fixa, e
SHALL manter essa simulação ativa enquanto o grafo estiver exibido, de
modo que o movimento de um nó seja transmitido aos nós conectados a ele.
O usuário SHALL poder reposicionar qualquer nó livremente por arraste,
sem que o nó seja realinhado automaticamente a uma posição fixa anterior.
Quando o movimento cessa, a simulação SHALL se estabilizar sozinha, sem
oscilação perceptível.

#### Scenario: Grafo com dependências transitivas não fica organizado em colunas fixas
- **WHEN** o grafo é renderizado com uma cadeia de dependências
  transitivas (`UnitA -> UnitB -> UnitC`)
- **THEN** as posições finais dos nós não seguem uma grade ou sequência
  fixa de colunas — a disposição resulta do equilíbrio de forças entre
  os nós e arestas

#### Scenario: Usuário arrasta um nó já estabilizado
- **WHEN** o grafo já estabilizou e o usuário arrasta um nó para uma
  nova posição
- **THEN** o nó permanece na posição escolhida pelo usuário enquanto o
  arrasta, sem ser realinhado automaticamente a uma posição anterior

#### Scenario: Arrastar um nó puxa os nós conectados a ele
- **WHEN** o grafo já estabilizou e o usuário arrasta `UnitB`, que é
  ligada a `UnitC` por uma aresta
- **THEN** `UnitC` se move em direção a `UnitB` durante o arraste, e o
  grafo se acomoda em uma nova disposição estável depois que o usuário
  solta o nó

#### Scenario: Grafo em repouso não se move sozinho
- **WHEN** o grafo já se acomodou depois de uma interação e o usuário
  não interage com ele
- **THEN** os nós permanecem parados nas suas posições

## ADDED Requirements

### Requirement: Arestas são sempre retas e acompanham os nós
O sistema SHALL desenhar toda aresta do Dependency Graph como um
segmento reto entre o nó de origem e o nó de destino, com a seta
indicando a direção da dependência (da unit que usa para a unit usada),
e SHALL manter as duas pontas da aresta ligadas aos respectivos nós
durante e depois de qualquer movimento, seja por arraste do usuário ou
pela simulação de forças. A aresta SHALL NOT se curvar quando um nó é
movido.

#### Scenario: Aresta permanece reta ao arrastar um nó
- **WHEN** o usuário arrasta `UnitB`, alvo de uma aresta `UnitA -> UnitB`
- **THEN** a aresta continua sendo um segmento reto, do início ao fim do
  arraste

#### Scenario: Pontas da aresta acompanham o nó movido
- **WHEN** o usuário arrasta `UnitB` para uma nova posição
- **THEN** a ponta da aresta `UnitA -> UnitB` junto a `UnitB` (com a
  seta) acompanha o nó até a nova posição, sem ficar na posição anterior

### Requirement: A Root Unit começa no centro da tela
Ao abrir o grafo, o sistema SHALL posicionar a Root Unit no centro da
área visível, com os demais nós dispostos ao redor dela, e SHALL
enquadrar o grafo inteiro na área visível uma única vez, ao final da
disposição inicial. Depois desse enquadramento, a Root Unit SHALL poder
ser arrastada como qualquer outro nó.

#### Scenario: Grafo recém-aberto tem a Root Unit centralizada
- **WHEN** o usuário escolhe uma Root Unit e o grafo termina a
  disposição inicial
- **THEN** o nó da Root Unit está no centro da área visível, e o grafo
  inteiro cabe na área visível

#### Scenario: Root Unit pode ser movida depois da abertura
- **WHEN** o grafo já foi aberto e o usuário arrasta a Root Unit para
  outro ponto da tela
- **THEN** a Root Unit permanece onde o usuário a soltou, e os nós
  conectados a ela se acomodam ao redor da nova posição

### Requirement: O View Filter reacomoda o grafo sem mover a câmera
Quando o estado do View Filter muda e nós ou arestas são exibidos ou
ocultados, o sistema SHALL deixar a simulação de forças reacomodar os nós
restantes, sem congelar as posições atuais, e SHALL NOT reenquadrar nem
deslocar a câmera (zoom e posição da visão ficam como o usuário os
deixou).

#### Scenario: Ocultar nós reacomoda os que restam
- **WHEN** o usuário desmarca "Implementação" e vários nós deixam de ser
  exibidos
- **THEN** os nós que continuam visíveis se reacomodam por equilíbrio de
  forças e se estabilizam sozinhos

#### Scenario: A câmera não se move ao filtrar
- **WHEN** o usuário dá zoom, arrasta a visão e em seguida alterna
  qualquer checkbox do View Filter
- **THEN** o zoom e a posição da visão permanecem os mesmos de antes da
  alteração do filtro
