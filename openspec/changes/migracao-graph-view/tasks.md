# Tasks

## 1. Setup e Estrutura Base

- [x] 1.1 Criar `src/renderer/components/GraphView.svelte` com script boilerplate (imports, state variables) e verificar arquivo é criado com sucesso
- [x] 1.2 Importar `vis-network`, `vis-data` e funções do domain em GraphView.svelte; verificar imports resolvem sem erro

## 2. Renderização do Grafo

- [x] 2.1 Implementar `onMount()` que cria instância Network com container via ref Svelte (não getElementById); verificar Network renderiza sem erro ao montar
- [x] 2.2 Implementar `onDestroy()` para limpar Network instance; verificar memory não vaza ao desmontar componente
- [x] 2.3 Criar `$state` para nodesData, edgesData, rootUnitId; implementar função `renderGraph()` que atualiza esses states e re-renderiza grafo; verificar vis-network responde a mudanças de dados
- [x] 2.4 Implementar opções vis-network (groups, physics, arrows) identicamente ao original; verificar estilo visual (ellipses para projectUnit, boxes para externalUnit, cores iguais) é mantido

## 3. Filtro de Visualização

- [x] 3.1 Criar `$state` para três checkboxes (interfaceVisible, implementationVisible, externalVisible) com valores iniciais (true, true, false); verificar checkboxes renderizam com bindings corretos
- [x] 3.2 Implementar mapa edgeOriginById (edge ID → origin) migrando lógica do graphView.js; verificar mapa é construído corretamente
- [x] 3.3 Implementar `$derived` para nodosVisíveis e arestasVisíveis baseado em estado dos filtros; verificar derivação recompila quando checkbox muda
- [x] 3.4 Implementar handlers `onChange` para checkboxes com lógica de validação (pelo menos interface ou implementation deve estar marcado); verificar checkbox não pode ser desmarcado se é o único marcado
- [x] 3.5 Atualizar Network quando filtros mudam (via `edges.update()` e `nodes.update()`); verificar ocultação de nós/arestas funciona e rootUnit fica sempre visível

## 4. Integração com CommandPalette

- [x] 4.1 Atualizar `src/renderer/index.js` para importar GraphView.svelte e criar binding `bind:this={graphViewComponent}`; verificar componente monta sem erro
- [x] 4.2 Expor `renderGraph` em CommandPalette.svelte como `graphViewComponent.renderGraph(nodesData, edgesData, rootUnitId)` e garantir `markGraphRendered()` é chamado após (já existe no código); verificar função é chamada corretamente ao expandir unit e store é atualizada
- [x] 4.3 Remover import de `graphView.js` de CommandPalette.svelte; verificar não há imports órfãos

## 5. Testes Unitários

- [x] 5.1 Criar `src/renderer/components/GraphView.test.js` com teste de renderização (montar componente, verificar container renderiza); verificar test passes
- [x] 5.2 Adicionar teste de filtros (montar, chamar renderGraph com dados, clicar checkboxes, verificar nós se ocultam); verificar test passes
- [x] 5.3 Adicionar teste de validação de checkbox (tentar desmarcar único filtro marcado, verificar re-marca automaticamente); verificar test passes
- [x] 5.4 Rodar `npm test` e verificar todos os testes passam (domain + componentes)

## 6. Verificação e Cleanup

- [x] 6.1 Deletar `src/renderer/components/graphView.js`; verificar arquivo é removido do repositório
- [x] 6.2 Build Vite compilou com sucesso (npx vite build); sem erros de compilação
- [x] 6.3 Testes passando (49/49) sem warnings críticos
- [x] 6.4 Build produção validado; pronto para npm start end-to-end

