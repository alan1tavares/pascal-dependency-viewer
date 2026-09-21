## Context

Todo o comportamento visual do grafo mora em `renderGraph`
(`src/renderer/components/graphView.js`), que monta os `DataSet`s, as
opções do `vis-network` (v10.1.2) e o View Filter. Estado atual:

- `groups` define só `projectUnit` (elipse azul) e `externalUnit` (caixa
  cinza). A Root Unit vem de `expandDependencyGraph` com `group:
  projectUnit`, então é igual às outras.
- `edges` só configura `arrows: 'to'`; o `smooth` fica no padrão
  `dynamic`, que depende de nós de suporte simulados pela física.
- `physics` usa `forceAtlas2Based` (`avoidOverlap: 1`, `springLength: 100`,
  `centralGravity: 0.05`) e é desligada em `stabilizationIterationsDone`.
  Esse desligamento escondia um problema: com `avoidOverlap: 1` a
  simulação nunca entra em repouso, então deixá-la ligada faz o grafo
  "piscar" (ver decisão 3).
- O View Filter só altera `hidden` em nós e arestas via `DataSet.update`.
- O renderer não tem testes Jest (só `src/domain/**` tem), então a
  verificação é manual no app.

Motivação e escopo estão em `proposal.md`; os requisitos, em `specs/`.

## Goals / Non-Goals

**Goals:**
- Destacar a Root Unit, deixar as arestas retas e dar ao grafo uma física
  contínua parecida com a do Obsidian, com a Root Unit centralizada na
  abertura.
- Concentrar a mudança em `graphView.js`, sem tocar em `domain`, `main` ou
  `preload`.

**Non-Goals:**
- Mudar o formato dos nós (elipse/caixa) ou a paleta de Project Unit e
  External Unit.
- Persistir posições dos nós entre sessões ou entre trocas de Root Unit.
- Reenquadrar a câmera ao filtrar ou ao arrastar.
- Alterar o vocabulário (`CONTEXT.md`) ou criar ADR.

## Decisions

**1. A Root Unit vira um group próprio (`rootUnit`), atribuído no
renderer.** `renderGraph` já recebe `rootUnitId`; ao montar os nós, o nó
com esse `id` recebe `group: 'rootUnit'`. O group define `shape: 'ellipse'`,
cor de destaque, `borderWidth` maior, `size`/escala maior e
`font: { bold }`. Alternativas: (a) emitir `rootUnit` em
`expandDependencyGraph`, mas isso contaminaria o domínio com uma
preocupação de exibição e mudaria o contrato testado de `{ nodes, edges }`;
(b) aplicar estilo por nó, sem group, o que espalha a decisão de estilo. O
group mantém a estilização declarativa, como já é para os outros dois.
O `nodeGroupById` do View Filter continua lendo o `group` original dos
`nodesData`, então a checagem de `externalUnit` não é afetada.

**2. `edges.smooth: false`.** Remove os nós de suporte, que são a causa
das curvas e das pontas desalinhadas com a física desligada. Fica
independente da física e é barato. Alternativa: manter `smooth` e deixar
a física sempre ligada. Isso reduziria os sintomas, mas as curvas
continuariam existindo e o pedido é por arestas retas.

**3. Física sempre viva, sem `avoidOverlap`, com repulsão forte e
`minVelocity` alto.** Remove-se o `network.setOptions({ physics: false })`
do `stabilizationIterationsDone` e mantém-se o solver `forceAtlas2Based`.
Medindo no app (Electron sob xvfb, com o projeto `cine-tapioca` e a
`uPrincipal` como raiz, 13 nós visíveis e 58 com External Units), o
primeiro ajuste (`avoidOverlap: 1`, `damping: 0.6`) fez 13 nós se moverem
20-30 px a cada 100 ms para sempre, que era o "piscar". Causas e ajustes:
- `avoidOverlap: 1` faz o vis-network limitar a distância mínima a 0,1
  quando dois nós se tocam, o que gera forças enormes e oscilação
  permanente (com `avoidOverlap: 0` o grafo repousa). Ele sai, e o
  espaçamento passa a vir de `gravitationalConstant: -800` (repulsão
  forte), que mantém 0 a 2 sobreposições mesmo com os 58 nós visíveis.
- `damping` é a fração da velocidade que passa para a iteração seguinte
  (não o "quanto amortece"), então valores altos amortecem menos. Volta
  a `0.4`.
- `minVelocity: 3` (o padrão é 0,75) faz o vis-network declarar a
  simulação estabilizada mais cedo e parar de vez. Numa bateria de 6
  disposições iniciais (com e sem External Units), cada uma perturbada
  por um arraste, só com `minVelocity: 3` as 6 repousaram; as outras
  variações testadas (`adaptiveTimestep`, `timestep`, `maxVelocity`,
  outros `damping`) ficaram entre 1/6 e 4/6.
- `maxVelocity: 15` (o padrão é 50, e usávamos 30) limita a velocidade
  máxima dos nós. Medido a cada quadro depois de soltar um nó arrastado, o
  pico caía de ~42 px/quadro para ~21 px/quadro e a variação brusca de
  velocidade de quadro a quadro caía a cerca de um terço, o que dá a
  sensação de movimento mais suave (sem "estalo" ao soltar). Valores
  menores (12) e `timestep` menor (0,25-0,4, com ou sem `adaptiveTimestep`)
  deixam o movimento ainda mais lento, mas não melhoraram o repouso,
  então ficaram de fora.
- `springLength: 150` e `springConstant: 0.05` deixam as arestas mais
  longas e frouxas. `stabilization.iterations` sobe para 1000 para o grafo
  já abrir em repouso.
O comportamento medido é: arrastar um nó puxa os vizinhos (100-250 px) e o
grafo repousa em cerca de 0,6-1,4 s depois de soltar. Os valores exatos
ficam como constantes no arquivo e não são requisito de spec.
Alternativas: manter `avoidOverlap` (descartada: é a causa do piscar) e
ligar/desligar a física em `dragStart`/`dragEnd` (descartada: mais código
para o mesmo efeito visível).

**4. A câmera é centralizada na Root Unit ao fim da estabilização.** O
plano original fixava a raiz em (0,0) durante a estabilização e chamava
`network.fit()`. Na prática a raiz não fica em (0,0) (o vis-network a
desloca mesmo com `fixed`), e o `fit()` centraliza a caixa do grafo, não a
raiz (ela ficava ~55 px fora do centro). Em vez disso, `centerOnRootUnit`
lê a posição real da raiz, calcula o maior afastamento (largura e altura)
dos nós visíveis em relação a ela e chama `network.moveTo({ position:
raiz, scale })`, com o zoom limitado a 1 e uma margem de 10 %. Assim a
raiz cai exatamente no centro do canvas (medido: 600 x 386,5 num canvas de
1200 x 773) e o grafo inteiro cabe. Os campos `x`, `y` e `fixed` da raiz
foram removidos, já que não mudavam o resultado. Alternativa: manter a
raiz fixa para sempre, rejeitada porque o Obsidian não trava nós.

**5. Nós e arestas ocultos saem da simulação.** No vis-network, um nó
com `hidden: true` continua participando da física (só
`options.physics` decide isso), então nós escondidos pelo View Filter
continuariam repelindo e puxando os visíveis, e a "reacomodação" não
aconteceria de fato. Por isso `applyViewFilter` passa a atualizar também
`physics: !hidden` junto com `hidden` em nós e arestas. Ao reexibir, o nó
volta à simulação. Não há reenquadramento da câmera nesse caminho, o que atende
ao requisito de não mexer na câmera. Alternativa: deixar como está.
Descartada por deixar espaço vazio onde havia nós ocultos e por reduzir o
efeito visível do filtro.

## Risks / Trade-offs

- [`nodes.update` de `hidden`/`physics` pode não reacordar a simulação já
  parada pelo `minVelocity`] → confirmado no app: o vis-network dispara `startStabilizing` e a
  simulação reacomoda e repousa em ~0,1 s; `startSimulation()` não é
  necessário.
- [Física sempre ligada mantém o grafo "se mexendo" um pouco depois de
  cada interação] → `minVelocity: 3` faz a simulação parar em ~1 s depois de cada
  interação, medido no app.
- [Em grafos muito grandes, a simulação contínua custa CPU durante o
  movimento] → só ocorre enquanto há energia; em repouso não há custo.
  `avoidOverlap` já era usado na estabilização inicial.
- [O enquadramento único pode ocorrer antes de todas as forças assentarem]
  → ocorre em `stabilizationIterationsDone`, depois de até 1000 iterações;
  nas medições o grafo já abre em repouso.
- [Sem testes automatizados no renderer] → verificação manual guiada
  pelos cenários das specs (lista em `tasks.md`).
