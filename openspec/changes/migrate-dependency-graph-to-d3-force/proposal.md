# Proposal

## Why

O grafo de dependências é renderizado hoje com `vis-network`/`vis-data`
(único consumidor: `src/renderer/components/graphView.js`). O
comportamento visual e de física dessa biblioteca não está agradando —
esta mudança migra a camada de visualização para `d3-force`, para
validar se ela atende melhor ao cenário deste projeto (grafos de
dependência de units Pascal, com fan-out/fan-in alto e ciclos diretos
entre units). É uma migração exploratória de biblioteca, não uma
correção de bug pontual.

## What Changes

- **BREAKING**: substitui `vis-network`/`vis-data` por `d3-force`,
  `d3-selection`, `d3-drag` e `d3-zoom` (submódulos individuais, não o
  meta-pacote `d3`) em `package.json`. Nenhum outro arquivo do projeto
  depende dessas bibliotecas, então a troca é "big bang" — sem período
  de coexistência entre as duas.
- Reescreve `graphView.js` para renderizar o grafo em SVG (não Canvas),
  construindo do zero o que o `vis-network` entregava pronto:
  renderização de nodes/edges, setas nas arestas (`<marker>` SVG),
  estilização por grupo (`projectUnit` = elipse `#97C2FC`,
  `externalUnit` = retângulo `#D3D3D3`), drag de nós (`d3-drag`) e
  zoom/pan (`d3-zoom`). Paridade visual exata com o que existe hoje —
  redesenho de aparência (cores/formas novas) fica fora desta mudança.
- **BREAKING**: muda o comportamento de física do grafo:
  - Alternar qualquer checkbox do View Filter reaquece a simulação de
    física (equivalente a resetar `alpha` e deixar convergir), que
    estabiliza e desliga sozinha ao final — hoje o `vis-network` só
    aplica `hidden: true/false` sem tocar a física.
  - Arrastar um nó passa a seguir o padrão elástico canônico do
    `d3-force`: a posição fica fixa (`fx`/`fy`) apenas durante o gesto
    de arraste, sendo liberada (`fx = fy = null`) imediatamente ao
    soltar o mouse — o nó nunca fica permanentemente fixo, nem durante
    um reaquecimento por filtro subsequente. Isso reverte o
    comportamento atual, onde um nó arrastado permanece fixo na
    posição escolhida indefinidamente.
- Introduz `jsdom` como `testEnvironment` no Jest e testes automatizados
  para a lógica não-visual de `graphView.js`: cálculo de visibilidade do
  View Filter, montagem/mapeamento de nodes e edges a partir dos dados
  de entrada, e as transições de estado `fx`/`fy` no ciclo de drag e no
  reaquecimento por filtro. A renderização visual em si (posições
  finais, aparência) continua validada manualmente, não por teste
  automatizado.

## Capabilities

### New Capabilities

(nenhuma — a migração reformula o comportamento de capabilities já
existentes, não introduz um recurso novo)

### Modified Capabilities

- `dependency-graph-layout`: o cenário de arraste muda de "nó
  permanece fixo na posição escolhida, sem ser realinhado
  automaticamente" para "nó é liberado de volta à física ao soltar o
  mouse, podendo ser reposicionado pela simulação" (drag elástico). A
  garantia de espaçamento mínimo entre nós (sem sobreposição) e a
  disposição orgânica livre (sem níveis/colunas fixas) continuam
  valendo, agora implementadas via `d3.forceCollide` combinado com
  `forceManyBody`/`forceLink`/força de centralização, em vez do solver
  `forceAtlas2Based` do `vis-network`.
- `graph-canvas-layout`: a área de renderização do grafo passa a ser um
  elemento `<svg>` em vez do canvas do `vis-network`. O requisito de
  preencher 100% da janela e se redimensionar com ela continua o
  mesmo, só muda a tecnologia por trás.
- `graph-view-filter`: adiciona o requisito de que alternar o filtro
  reaquece a simulação de física do grafo (comportamento novo, ausente
  hoje). Os requisitos de quais nodes/edges ficam visíveis por origem
  (Uses Clause Origin) e por classificação (External Unit) não mudam,
  só passam a coexistir com esse reaquecimento.

## Impact

- `src/renderer/components/graphView.js`: reescrita completa.
- `package.json`: remove `vis-network` e `vis-data`; adiciona
  `d3-force`, `d3-selection`, `d3-drag`, `d3-zoom`.
- `jest.config.js`: `testEnvironment` passa a `jsdom` (ou configuração
  equivalente por projeto/glob, se necessário para não afetar os
  testes existentes de `src/domain/`, que não precisam de DOM).
- `openspec/specs/dependency-graph-layout/spec.md`,
  `openspec/specs/graph-canvas-layout/spec.md`,
  `openspec/specs/graph-view-filter/spec.md`: specs atualizadas por
  esta mudança (deltas em `specs/` desta pasta de change).
- Fora de escopo: qualquer mudança de UX fora de `graphView.js`
  (Command Palette, seleção de Root Unit, IPC, parsing de `.pas`/`.dpr`)
  permanece intocada.
