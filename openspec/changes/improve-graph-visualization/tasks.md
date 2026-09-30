## 1. Destaque da Root Unit e arestas retas

- [x] 1.1 Em `src/renderer/components/graphView.js`, adicionar o group `rootUnit` (elipse, cor de destaque, borda mais grossa, tamanho maior, label em negrito) e atribuí-lo ao nó com `id === rootUnitId` ao montar os `nodesData`; verificar no app (`npm start`) que a Root Unit aparece destacada e as demais Project/External Units mantêm o estilo atual
- [x] 1.2 Confirmar que o `nodeGroupById` do View Filter continua usando o `group` original dos `nodesData` (a Root Unit não é `externalUnit`) e que desmarcar Interface/Implementação com a Root Unit isolada a mantém visível e destacada
- [x] 1.3 Configurar `edges.smooth: false` mantendo `arrows: 'to'`; verificar no app que todas as arestas são retas, com seta, e que as pontas acompanham o nó ao arrastá-lo

## 2. Física estilo Obsidian e Root Unit centralizada

- [x] 2.1 Remover o `network.setOptions({ physics: false })` de `stabilizationIterationsDone` e ajustar a física (sem `avoidOverlap`, `gravitationalConstant: -800`, `springLength` maior, `damping: 0.4`, `minVelocity: 3`, `stabilization.iterations: 1000`); verificado no app (Electron sob xvfb, projeto `cine-tapioca`, raiz `uPrincipal`): arrastar um nó puxa os vizinhos e o grafo repousa em ~1 s depois de soltar, sem piscar
- [x] 2.2 Ao fim da estabilização, centralizar a câmera na Root Unit (`centerOnRootUnit`: `moveTo` na posição real da raiz, com zoom que enquadra o grafo inteiro, uma única vez); verificado no app: a raiz fica em (600; 386,5) num canvas de 1200 x 773 e continua arrastável (o plano original de fixar a raiz em (0,0) e usar `fit()` foi trocado, ver design.md, decisão 4)
- [x] 2.3 Verificar que não há sobreposição de nós no grafo aberto (cenários de fan-out alto e de ciclo direto de `dependency-graph-layout`) com os novos parâmetros de física

## 3. View Filter com física viva

- [x] 3.1 Em `applyViewFilter`, atualizar `physics: !hidden` junto com `hidden` em nós e arestas, para que itens ocultos saiam da simulação; verificar no app que, ao desmarcar "Implementação" ou "Unidades Externas", os nós restantes se reacomodam e se estabilizam sozinhos
- [x] 3.2 Verificar no app que o `hidden`/`physics` acorda a simulação já parada; verificado: o vis-network dispara `startStabilizing` ao alternar "Unidades Externas" e o grafo repousa em ~0,1 s, então `network.startSimulation()` não é necessário
- [x] 3.3 Verificar no app que zoom e posição da visão permanecem iguais ao alternar qualquer checkbox do View Filter (nenhum `fit()` fora da abertura do grafo)

## 4. Verificação final

- [x] 4.1 Rodar `npm test` e confirmar que a suíte Jest continua passando (nenhum arquivo de `src/domain/**` é alterado)
- [ ] 4.2 Percorrer manualmente os cenários de `specs/root-unit-highlight/spec.md` e `specs/dependency-graph-layout/spec.md` com um `.dpr` real e registrar qualquer divergência
- [x] 4.3 Rodar `openspec validate improve-graph-visualization` e confirmar que a change é válida
