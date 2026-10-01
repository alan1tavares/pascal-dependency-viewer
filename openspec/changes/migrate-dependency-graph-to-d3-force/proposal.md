# Proposal

## Why

O grafo de dependências é renderizado hoje com `vis-network`/`vis-data`
(único consumidor: `src/renderer/components/graphView.js`). O
comportamento visual e de física dessa biblioteca não está agradando.
Esta mudança adiciona `d3-force` como um segundo motor de renderização,
selecionável em runtime pela Command Palette, para validar se ele
atende melhor ao cenário deste projeto (grafos de dependência de units
Pascal, com fan-out/fan-in alto e ciclos diretos entre units) sem
remover a opção de voltar ao comportamento atual. É uma migração
exploratória de biblioteca com os dois motores coexistindo
permanentemente como opção do usuário, não uma substituição definitiva
nem um rollout temporário.

## What Changes

- Adiciona `d3-force`, `d3-selection`, `d3-drag` e `d3-zoom` (submódulos
  individuais, não o meta-pacote `d3`) ao `package.json`, ao lado de
  `vis-network`/`vis-data` — nenhuma das duas bibliotecas é removida.
- Adiciona um segundo caminho de renderização do Dependency Graph, em
  SVG, que reconstrói o que o `vis-network` entrega pronto hoje:
  renderização de nodes/edges, setas nas arestas (`<marker>` SVG),
  estilização por grupo (`projectUnit` = elipse `#97C2FC`,
  `externalUnit` = retângulo `#D3D3D3` — paridade visual com o
  `vis-network`), drag de nós (`d3-drag`) e zoom/pan (`d3-zoom`).
- No motor `d3-force` (e somente nele — o caminho `vis-network`
  existente não muda):
  - Alternar qualquer checkbox do View Filter reaquece a simulação de
    física (equivalente a resetar `alpha` e deixar convergir), que
    estabiliza e desliga sozinha ao final.
  - Arrastar um nó segue o padrão elástico canônico do `d3-force`: a
    posição fica fixa (`fx`/`fy`) apenas durante o gesto de arraste,
    sendo liberada (`fx = fy = null`) imediatamente ao soltar o mouse —
    o nó nunca fica permanentemente fixo.
- Adiciona o Command `Alternar renderização do grafo` ao catálogo da
  Command Palette (sempre disponível, mesmo sem Project aberto). Ao ser
  executado, alterna o motor selecionado entre `vis-network` e
  `d3-force`; se um grafo já está em exibição, ele é re-renderizado
  imediatamente com o outro motor, reusando os mesmos dados (sem nova
  leitura de arquivo nem nova expansão). O motor padrão ao iniciar o
  app é `vis-network`, e a seleção não persiste entre sessões.
- Validação é manual: não introduz testes automatizados novos para a
  lógica de renderização do grafo (nenhum dos dois motores).

## Capabilities

### New Capabilities

- `graph-renderer-selection`: qual motor de renderização do Dependency
  Graph está selecionado, o efeito de alterná-lo pela Command Palette
  (re-renderiza o grafo atual com o outro motor), o padrão ao iniciar
  o app, e a não-persistência da escolha entre sessões.

### Modified Capabilities

- `dependency-graph-layout`: descreve o comportamento do motor
  `d3-force` como o estado-alvo destes requisitos — o cenário de
  arraste muda de "nó permanece fixo na posição escolhida" para "nó é
  liberado de volta à física ao soltar o mouse". A garantia de
  espaçamento mínimo entre nós e a disposição orgânica livre continuam
  valendo, agora via `d3.forceCollide` combinado com
  `forceManyBody`/`forceLink`/força de centralização. (O comportamento
  do motor `vis-network`, quando selecionado, não é coberto por
  nenhuma spec ativa — ver `design.md`.)
- `graph-canvas-layout`: quando o motor `d3-force` está selecionado, a
  área de renderização do grafo é um elemento `<svg>` em vez do canvas
  do `vis-network`. O requisito de preencher 100% da janela e se
  redimensionar com ela continua o mesmo.
- `graph-view-filter`: adiciona o requisito de que, no motor
  `d3-force`, alternar o filtro reaquece a simulação de física do
  grafo (comportamento novo, ausente no `vis-network`). Os requisitos
  de quais nodes/edges ficam visíveis por origem e por classificação
  não mudam.
- `command-palette`: o catálogo de Commands ganha um 4º item,
  `Alternar renderização do grafo`, sempre disponível (mesmo sem
  Project aberto), com seu próprio comportamento de execução.

## Impact

- `src/renderer/components/graphView.js`: passa a ser um dos dois
  caminhos de renderização (o do `vis-network`, inalterado em
  comportamento) por trás de um dispatcher que escolhe o motor
  selecionado; o novo caminho `d3-force` é um módulo novo (ver
  `design.md` para o layout exato).
- `package.json`: adiciona `d3-force`, `d3-selection`, `d3-drag`,
  `d3-zoom`; `vis-network` e `vis-data` permanecem.
- `src/domain/commands/`: novo Command `Alternar renderização do
  grafo` no catálogo `COMMANDS`.
- `src/main/commands.js`, `src/main/menu.js` (se aplicável): roteamento
  do novo Command, sem lógica de diálogo/arquivo — apenas dispara o
  toggle no renderer.
- `src/renderer/index.js`: passa a reter o último grafo renderizado
  (nodes/edges/Root Unit) para permitir o re-render imediato ao
  alternar o motor.
- `openspec/specs/dependency-graph-layout/spec.md`,
  `openspec/specs/graph-canvas-layout/spec.md`,
  `openspec/specs/graph-view-filter/spec.md`,
  `openspec/specs/command-palette/spec.md`: specs atualizadas por esta
  mudança (deltas em `specs/` desta pasta de change).
- `openspec/specs/graph-renderer-selection/spec.md`: nova spec.
- Fora de escopo: qualquer mudança de UX fora do descrito acima
  (seleção de Root Unit, IPC de projeto/`.dpr`, parsing de `.pas`)
  permanece intocada. Testes automatizados para a lógica de
  renderização do grafo não fazem parte desta mudança.
