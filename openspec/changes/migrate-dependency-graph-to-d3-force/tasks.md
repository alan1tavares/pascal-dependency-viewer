# Tasks

## 1. Dependências

- [ ] 1.1 Adicionar `d3-force`, `d3-selection`, `d3-drag` e `d3-zoom`
      ao `package.json`, mantendo `vis-network` e `vis-data` como
      estão; verificar que `npm install` conclui sem erro.

## 2. Dispatcher e extração do caminho vis-network

- [ ] 2.1 Extrair a implementação atual de `graphView.js` para trás de
      um dispatcher que escolhe o motor selecionado (`vis-network` por
      padrão), sem alterar seu comportamento; verificar manualmente
      que o grafo renderizado por `vis-network` continua idêntico ao
      de antes desta mudança (mesma física, mesmo drag fixo, mesmo
      View Filter sem reaquecimento).
- [ ] 2.2 Fazer `src/renderer/index.js` reter o último
      `{ nodesData, edgesData, rootUnitId }` passado para
      `renderGraph`, para uso pelo toggle de motor (Tarefa 4).

## 3. Motor d3-force: simulação de força (layout)

- [ ] 3.1 Criar `graphViewD3Force.js`; configurar `forceManyBody`
      (repulsão) e `forceLink` (distância ≈ 100); verificar
      manualmente que uma cadeia transitiva (`UnitA -> UnitB -> UnitC`)
      não se organiza em colunas fixas (cenário de
      `dependency-graph-layout`).
- [ ] 3.2 Adicionar `forceCollide` com raio por nó calculado a partir
      do tamanho do label; verificar manualmente os dois cenários de
      não-sobreposição da spec (fan-out alto para uma dependência
      comum; ciclo direto entre duas Project Units).
- [ ] 3.3 Adicionar uma força de centralização fraca (`forceCenter` ou
      `forceX`/`forceY` para o centro do container).
- [ ] 3.4 Ligar o evento `"tick"` da simulação para atualizar as
      posições renderizadas, e o evento `"end"` (quando `alpha` cai
      abaixo de `alphaMin`) para parar de re-renderizar.

## 4. Motor d3-force: renderização SVG

- [ ] 4.1 Criar um elemento `<svg>` dentro de `#mynetwork`, dimensionado
      a 100% do container, com um listener de resize da janela que
      reajusta o tamanho do `<svg>`; verificar manualmente maximizando
      e redimensionando a janela (cenários de `graph-canvas-layout`).
- [ ] 4.2 Renderizar cada node como `<ellipse>` (grupo `projectUnit`,
      cor `#97C2FC`) ou `<rect>` (grupo `externalUnit`, cor `#D3D3D3`),
      dimensionado pelo texto do `label`, com um `<text>` centralizado
      — paridade visual com a configuração atual de `groups` do
      vis-network.
- [ ] 4.3 Renderizar cada edge como uma linha com marcador de seta
      (`<marker>` SVG) apontando do node de origem para o node de
      destino, atualizando as duas pontas a cada `"tick"`.

## 5. Motor d3-force: interação (drag, zoom/pan, view filter)

- [ ] 5.1 Implementar drag elástico por nó com `d3-drag`: `dragstarted`
      fixa `fx`/`fy` e reaquece (`alphaTarget(0.3).restart()`);
      `dragged` atualiza `fx`/`fy`; `dragended` zera `alphaTarget` e
      libera `fx`/`fy` (`= null`) imediatamente. Verificar manualmente
      que, após soltar um nó, ele pode ser reposicionado pela física.
- [ ] 5.2 Implementar zoom/pan no `<svg>` com `d3-zoom`; verificar
      manualmente que arrastar um nó não movimenta a viewport e que o
      painel de View Filter permanece fixo durante pan/zoom.
- [ ] 5.3 Ligar os três checkboxes existentes do View Filter à lógica
      de visibilidade (porte sobre o mesmo cálculo de
      `isOriginVisible`/`isEdgeVisible` hoje em `graphView.js`),
      alternando um atributo de visibilidade SVG sem remover
      nodes/edges da simulação; verificar manualmente cada cenário de
      `graph-view-filter`.
- [ ] 5.4 Ao mudar qualquer checkbox, reaquecer a simulação
      (`simulation.alpha(0.3).restart()`); verificar manualmente que
      um nó arrastado antes do toggle não permanece fixo (cenário
      "Nó arrastado anteriormente não fica fixo durante o
      reaquecimento" de `graph-view-filter`).

## 6. Command "Alternar renderização do grafo"

- [ ] 6.1 Adicionar o Command ao catálogo `COMMANDS`
      (`src/domain/commands/`): id próprio, label `Alternar
      renderização do grafo`, `requiresProject: false`, sem atalho;
      verificar que ele aparece na posição correta tanto com quanto
      sem Project aberto (cenários de `command-palette`).
- [ ] 6.2 Rotear o Command em `src/main/commands.js` (`runCommand`):
      enviar `app:toggle-graph-renderer` via `webContents.send`, sem
      lógica de diálogo/arquivo.
- [ ] 6.3 No renderer, ouvir `app:toggle-graph-renderer`, alternar o
      motor selecionado (padrão `vis-network`) e, se houver um grafo
      em exibição, re-renderizá-lo imediatamente com o outro motor
      usando o `{ nodesData, edgesData, rootUnitId }` retido (Tarefa
      2.2) — sem nova leitura de arquivo nem nova expansão. Verificar
      manualmente os três cenários de `graph-renderer-selection`
      (alternar com grafo em exibição, alternar sem grafo em exibição,
      padrão ao reiniciar o app).

## 7. Integração final

- [ ] 7.1 Rodar `npm start` e, para cada motor, abrir um projeto
      `.dpr` de teste e validar visualmente ponta a ponta, incluindo
      alternar entre os dois motores pela Command Palette.
- [ ] 7.2 Rodar `npm test`, confirmando que a suíte existente de
      `src/domain` continua passando sem nenhuma mudança (esta
      migração não adiciona testes automatizados para nenhum dos dois
      motores de renderização).
- [ ] 7.3 Passar manualmente por todos os cenários das specs
      modificadas e adicionadas (`dependency-graph-layout`,
      `graph-canvas-layout`, `graph-view-filter`, `command-palette`,
      `graph-renderer-selection`) e confirmar que nenhum regrediu —
      incluindo reconfirmar que o motor `vis-network` se comporta
      exatamente como antes desta mudança — antes de considerar a
      mudança pronta para archive.
