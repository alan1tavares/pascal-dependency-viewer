## 1. Configurar física orgânica ajustada no vis-network

- [x] 1.1 Em `renderGraph` (`src/renderer/components/graphView.js`), remover a
      opção `layout.hierarchical` e o solver `hierarchicalRepulsion`
      introduzidos na tentativa anterior, e verificar com `npm start` que o
      grafo ainda inicializa sem erros no console do DevTools.
      Verificado via harness Electron headless (Xvfb): inicializa sem
      exceções; usuário confirmou depois via `npm start` real.
- [x] 1.2 Configurar `physics.solver: 'forceAtlas2Based'` com
      `avoidOverlap: 1` (e demais parâmetros de `forceAtlas2Based` que se
      mostrarem necessários, como `springLength`), verificando visualmente
      (via `npm start`) com um `.dpr` que tenha fan-out alto (uma unit usada
      por várias outras) que nenhum nó fica colado ou sobreposto a outro.
      Primeira versão (`springLength: 150`) evitou sobreposição mas
      espalhou demais os nós — usuário reportou "alguns nós ficaram
      afastados demais" ao testar com `npm start`. Ajustado para
      `springLength: 100` (padrão) + `centralGravity: 0.05` para reduzir
      a dispersão geral mantendo `avoidOverlap`. Confirmado no harness que
      isso reduz a diagonal da caixa delimitadora do grafo em ~37% (de
      ~715 para ~451, num grafo denso de teste) sem reduzir a distância
      mínima entre nós (permanece ~87, sem sobreposição).
- [x] 1.3 Confirmar que `network.once('stabilizationIterationsDone', ...)`
      continua desligando a física ao final da estabilização, mantendo o
      grafo estático até uma interação do usuário.
      Confirmado no harness nos 4 cenários testados.

## 2. Validar cenários da spec `dependency-graph-layout`

- [x] 2.1 Abrir um `.dpr` com fan-out alto (várias units usando a mesma
      dependência comum) e verificar visualmente que nenhum nó fica
      sobreposto a outro.
      Verificado no harness (distância mínima ~87px, sem colisão).
- [x] 2.2 Abrir (ou criar um `.dpr` de teste com) um ciclo direto entre duas
      Project Units (`UnitA` usa `UnitB` e `UnitB` usa `UnitA` de volta) e
      verificar que ambos os nós são exibidos em posições distintas, sem
      sobreposição.
      Verificado no harness (distância ~187px entre os dois nós).
- [x] 2.3 Confirmar visualmente que o grafo não fica organizado em colunas
      ou níveis fixos (disposição orgânica, tipo mapa) e que arrastar um nó
      já estabilizado mantém a nova posição, sem realinhamento automático.
      Verificado no harness: cadeia `UnitA->UnitB->UnitC` não ficou em
      colunas fixas, e `moveNode` simulando um arraste manteve a posição
      após a física ser desligada.
- [x] 2.4 Comparar visualmente, num grafo com fan-in/fan-out alto, o
      cruzamento de arestas desta disposição orgânica com o resultado do
      layout hierárquico testado anteriormente, confirmando que ficou mais
      legível (menos arestas se cruzando).
      Um teste sintético automatizado (contagem geométrica de cruzamentos)
      não foi conclusivo — variou entre favorecer o hierárquico e o
      orgânico dependendo dos parâmetros, já que contagem bruta de
      cruzamentos é um proxy instável para "legibilidade" e sensível à
      semente aleatória da física. A validação real veio do usuário
      testando com `npm start` num projeto real: confirmou que a
      disposição orgânica ficou mais legível que a hierárquica.

## 3. Regressão

- [x] 3.1 Com o grafo renderizado, exercitar o View Filter
      (`#viewFilterInterface`, `#viewFilterImplementation`,
      `#viewFilterExternal`) e verificar que ocultar/exibir nós e arestas
      continua funcionando sem erros no console.
      `setUpViewFilter` não foi alterado por esta mudança; a API que usa
      (`DataSet.update({ hidden })`) foi testada no harness sem exceções.
- [x] 3.2 Rodar `npm test` e confirmar que a suíte Jest (`src/domain/**`)
      continua passando sem nenhuma alteração, já que a mudança é isolada ao
      renderer.
      `npm test`: 4 suites, 22 testes, todos passando.
