# Tasks

## 1. Dependências

- [ ] 1.1 Adicionar `d3-force`, `d3-selection`, `d3-drag` e `d3-zoom`
      ao `package.json`; remover `vis-network` e `vis-data`; verificar
      que `npm install` conclui sem erro e que nada mais no repositório
      importa `vis-network`/`vis-data` (`grep -r "vis-network\|vis-data" src/`
      não retorna resultado).
- [ ] 1.2 Adicionar `jest-environment-jsdom` como devDependency
      (necessário a partir do Jest 28 para usar o ambiente `jsdom` por
      arquivo); verificar com um teste mínimo usando
      `/** @jest-environment jsdom */` que o ambiente jsdom carrega sem
      erro, sem alterar o `testEnvironment` global do `jest.config.js`.

## 2. Lógica não-visual: View Filter e montagem de dados

- [ ] 2.1 Extrair o cálculo de visibilidade hoje em
      `isOriginVisible`/`isEdgeVisible` (`graphView.js`) para funções
      puras testáveis sem DOM, cobrindo com testes os cenários da spec
      `graph-view-filter`: origem `interface`/`implementation`/`both`,
      filtro de Unidades Externas combinado por E lógico, e node sem
      aresta visível some exceto a Root Unit.
- [ ] 2.2 Extrair a montagem de `edgesWithId`/`edgeOriginById` a partir
      de `edgesData` para uma função pura; testar que o `id` de cada
      aresta é `${from}::${to}` e que o `origin` é preservado.
- [ ] 2.3 Escrever testes (jsdom) para o estado inicial dos checkboxes
      (Interface/Implementação marcados, Unidades Externas desmarcado)
      e para a trava de mínimo que impede desmarcar as duas origens ao
      mesmo tempo, cobrindo os cenários correspondentes da spec.

## 3. Simulação de força (layout)

- [ ] 3.1 Configurar `forceManyBody` (repulsão) e `forceLink`
      (distância ≈ 100, equivalente ao `springLength` atual) sobre os
      dados de nodes/edges; verificar manualmente que uma cadeia
      transitiva (`UnitA -> UnitB -> UnitC`) não se organiza em colunas
      fixas (cenário de `dependency-graph-layout`).
- [ ] 3.2 Adicionar `forceCollide` com raio por nó calculado a partir
      do tamanho do label (substitui o `avoidOverlap`); verificar
      manualmente os dois cenários de não-sobreposição da spec
      (fan-out alto para uma dependência comum; ciclo direto entre
      duas Project Units).
- [ ] 3.3 Adicionar uma força de centralização fraca (`forceCenter` ou
      `forceX`/`forceY` para o centro do container), equivalente ao
      `centralGravity: 0.05` atual.
- [ ] 3.4 Ligar o evento `"tick"` da simulação para atualizar as
      posições renderizadas, e o evento `"end"` (quando `alpha` cai
      abaixo de `alphaMin`) para parar de re-renderizar — equivalente
      ao `stabilizationIterationsDone` atual.

## 4. Renderização SVG

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

## 5. Interação: drag e zoom/pan

- [ ] 5.1 Implementar drag elástico por nó com `d3-drag`: `dragstarted`
      fixa `fx`/`fy` na posição atual e reaquece a simulação
      (`alphaTarget(0.3).restart()`); `dragged` atualiza `fx`/`fy` para
      a posição do ponteiro; `dragended` zera o `alphaTarget` e libera
      `fx`/`fy` (`= null`) imediatamente. Verificar manualmente que,
      após soltar um nó, ele pode ser reposicionado pela física
      (cenário "Usuário solta um nó depois de arrastá-lo" de
      `dependency-graph-layout`).
- [ ] 5.2 Implementar zoom/pan no `<svg>` com `d3-zoom`; verificar
      manualmente que arrastar um nó não movimenta a viewport (drag de
      nó tem precedência sobre o pan de fundo) e que o painel de View
      Filter permanece fixo no canto superior direito durante pan/zoom
      (cenário de `graph-view-filter`).

## 6. View Filter: visibilidade e reaquecimento

- [ ] 6.1 Ligar os três checkboxes existentes
      (`#viewFilterInterface`, `#viewFilterImplementation`,
      `#viewFilterExternal`) às funções extraídas na Tarefa 2, alternando
      um atributo de visibilidade (`display`/`opacity`) nos elementos
      SVG de node/edge correspondentes — sem removê-los do DOM nem dos
      arrays `nodes`/`links` da simulação. Verificar manualmente cada
      cenário de mostrar/ocultar de `graph-view-filter`.
- [ ] 6.2 Ao mudar qualquer checkbox, reaquecer a simulação
      (`simulation.alpha(0.3).restart()`), deixando os nós visíveis se
      reposicionarem e a física desligar sozinha ao final. Verificar
      manualmente que um nó arrastado antes do toggle não permanece
      fixo (novo cenário "Nó arrastado anteriormente não fica fixo
      durante o reaquecimento" de `graph-view-filter`).

## 7. Integração final

- [ ] 7.1 Confirmar que `renderGraph(nodesData, edgesData, rootUnitId)`
      mantém a mesma assinatura e que `src/renderer/index.js` continua
      chamando-a sem alterações; rodar `npm start` e abrir um projeto
      `.dpr` de teste para validar visualmente ponta a ponta.
- [ ] 7.2 Rodar `npm test`, confirmando que a suíte de `src/domain`
      permanece intacta (ambiente `node`) e que os novos testes
      (ambiente `jsdom`) passam.
- [ ] 7.3 Passar manualmente por todos os cenários das três specs
      modificadas (`dependency-graph-layout`, `graph-canvas-layout`,
      `graph-view-filter`) e confirmar que nenhum regrediu antes de
      considerar a mudança pronta para archive.
