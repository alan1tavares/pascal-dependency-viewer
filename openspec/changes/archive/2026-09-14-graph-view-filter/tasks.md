## 1. Domain: extração com Uses Clause Origin

- [x] 1.1 Substituir `src/domain/parsePascalSource/usesClauseScope.js`
  por `USES_CLAUSE_ORIGIN` (`INTERFACE`, `IMPLEMENTATION`, `BOTH`) e
  remover todo uso de `USES_CLAUSE_SCOPE` no código-fonte, verificando
  com `grep -r USES_CLAUSE_SCOPE src/` que não sobra nenhuma referência
- [x] 1.2 Reescrever `selectUsesFromSource(source)` (sem parâmetro
  `scope`) para retornar `{ unitName, origin }[]`, uma entrada por unit
  única (case-insensitive), ordenada por primeira aparição
  (`interface` antes de `implementation`), reaproveitando
  `splitIntoSections`/`extractUsesFromSection` já existentes
- [x] 1.3 Atualizar `src/domain/test/parsePascalSource.test.js` para o
  novo contrato, cobrindo os cenários do spec `uses-clause-origin`
  (só interface, só implementation, presente nas duas → `both`, unit
  repetida na mesma seção, seção `implementation` ausente) e verificar
  com `npx jest src/domain/test/parsePascalSource.test.js`

## 2. Domain: expansão do grafo com origem por edge

- [x] 2.1 Atualizar `src/domain/expandDependencyGraph/index.js`: remover
  o parâmetro `scope`, consumir `selectUsesFromSource(source)` sem
  escopo, zipar o `origin` de cada `{unitName, origin}` com a
  classificação de `classifyExternalUnits` (mesma ordem), e empurrar
  `{ from, to, origin }` em vez de `{ from, to }`
- [x] 2.2 Adicionar `rootUnitId` (o id do node Root Unit) ao retorno de
  `expandDependencyGraph`, junto de `nodes`/`edges`
- [x] 2.3 Atualizar `src/domain/test/expandDependencyGraph.test.js` para
  o novo retorno (`origin` por edge, `rootUnitId`), cobrindo os cenários
  do spec `dependency-graph-expansion` (edge só-interface, só-
  implementation, `both`, dependência da Root Unit só na implementation,
  dependência de unidade intermediária só na implementation) e verificar
  com `npx jest src/domain/test/expandDependencyGraph.test.js`

## 3. Main/preload: remover `scope` do contrato IPC

- [x] 3.1 Remover o parâmetro `scope` de
  `performExpandFromRootUnit`/`registerGraphHandler`
  (`src/main/ipc/graph.js`) e da chamada a `expandDependencyGraph`
- [x] 3.2 Confirmar que `src/preload/api.js` não precisa de mudança
  (`expandFromRootUnit` já repassa `args` genericamente) e rodar
  `npm test` para garantir que nada mais depende de `scope` no main

## 4. Renderer: remover o radio da tela de listagem

- [x] 4.1 Remover o bloco `#usesScopeControl` (os dois `<input
  type="radio" name="usesScope">`) de `index.html`
- [x] 4.2 Remover a leitura de `usesScope`/`scope` em
  `src/renderer/components/rootUnitSelection.js`, chamando
  `api.expandFromRootUnit({ projectDir, projectUnit, projectUnits })`
  sem `scope`, e verificar manualmente (`npm start`) que a tela de
  listagem não exibe mais nenhum controle de interface/implementação

## 5. Renderer: painel flutuante de View Filter

- [x] 5.1 Adicionar a `index.html` o markup do painel (`#viewFilterPanel`,
  inicialmente `display: none`), com título e dois checkboxes
  independentes ("Interface" e "Implementação"), e o CSS inline
  (`position: fixed`, canto superior direito, acima do `#mynetwork`)
- [x] 5.2 Em `src/renderer/components/graphView.js`, mudar `renderGraph`
  para receber `rootUnitId` além de `nodes`/`edges`, sintetizar
  `id: `${from}::${to}`` em cada edge antes de montar o `DataSet`, e
  guardar a origem de cada edge por id (para uso do filtro)
- [x] 5.3 Exibir/esconder `#viewFilterPanel` junto com `#mynetwork`
  (mesma lógica de `style.display` já usada para alternar com
  `#rootUnitSelection`), e inicializar os dois checkboxes marcados a
  cada chamada de `renderGraph`
- [x] 5.4 Implementar o guard "pelo menos um marcado": ao desmarcar o
  único checkbox ainda marcado, reverter o estado (checkbox volta a
  ficar marcado) sem alterar o grafo, e verificar manualmente que não é
  possível deixar os dois desmarcados
- [x] 5.5 Implementar a filtragem dinâmica: em cada mudança do View
  Filter (via `checkbox.onchange`, não `addEventListener`, para não
  acumular listeners entre re-renders), recalcular o conjunto de edges
  visíveis (origem `both` conta como visível se qualquer checkbox
  estiver marcado) e o conjunto de nodes visíveis (união dos endpoints
  das edges visíveis, mais sempre `rootUnitId`), e aplicar via
  `edges.update`/`nodes.update` com `hidden: true/false`
- [x] 5.6 Verificar manualmente com `npm start`, abrindo um `.dpr` cujo
  Root Unit tenha dependências só de interface, só de implementation e
  de ambas: confirmar estado inicial com tudo visível, cada checkbox
  escondendo/reexibindo as edges e nodes corretos dinamicamente (sem
  travar/recarregar a janela), e a Root Unit nunca desaparecendo mesmo
  isolada. Verificado via Electron real (`_electron`/Playwright) sob
  xvfb com um `.dpr` fixture (`UnitPrincipal` com dependência só-
  interface, só-implementation e ambas): screenshots confirmam o
  painel, os checkboxes ligados/desligados e os nodes/edges
  aparecendo/sumindo dinamicamente; a listagem de Project Units não
  mostra mais nenhum controle de escopo

## 6. Limpeza de documentação obsoleta

- [x] 6.1 Remover de `docs/SUGGESTION.md` a sugestão pendente sobre
  envolver `#usesScopeControl` num `<fieldset>`/`<legend>`, já que o
  controle foi removido. Também removida a sugestão adjacente sobre
  cenários de Uses Clause Scope sem teste automatizado, que referenciava
  os mesmos cenários de radio removidos do spec `root-unit-selection`
- [x] 6.2 Corrigir em `CLAUDE.md` as duas referências desatualizadas
  encontradas durante o design desta change: a menção a "reads only the
  first uses clause" (não reflete mais `selectUsesFromSource`) e a
  referência a `domain/mountDependenceGraphStructure/index.js` (módulo
  que não existe mais)

## 7. Validação final

- [x] 7.1 Rodar `npm test` (suíte completa) e confirmar que todos os
  testes passam
- [x] 7.2 Rodar `openspec validate --changes "graph-view-filter" --strict`
  e confirmar que a change continua válida após as mudanças de código
