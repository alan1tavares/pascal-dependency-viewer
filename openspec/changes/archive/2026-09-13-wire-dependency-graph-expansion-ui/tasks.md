## 1. `expandDependencyGraph` passa a aceitar `scope`

- [x] 1.1 Adicionar parâmetro opcional `scope` a `expandDependencyGraph(rootUnitName, projectUnits, readFile, scope)` e repassá-lo às duas chamadas de `selectUsesFromSource` (Root Unit e cada Project Unit desenfileirada), sem quebrar chamadas existentes sem o quarto argumento
- [x] 1.2 Adicionar casos em `src/test/expandDependencyGraph.test.js` cobrindo: `scope: 'interfaceAndImplementation'` aplicado a uma Project Unit intermediária (não só à Root Unit) e `scope` omitido mantendo o comportamento atual (`interface` como padrão) — verificado com `npx jest src/test/expandDependencyGraph.test.js` (7/7 passando)

## 2. Ligar `expandDependencyGraph` à tela de Root Unit

- [x] 2.1 Em `index.html`, importar `expandDependencyGraph` e, em `selectRootUnit`, montar um `readFile` que resolve o caminho via `path.resolve(projectDir, path)` e lê com `fs.readFileSync(..., 'utf-8')`
- [x] 2.2 Trocar a chamada de `mountDependenceGraphStructure(unitName, listUses, projectUnits)` por `expandDependencyGraph(unitName, projectUnits, readFile, scope)` em `selectRootUnit`, mantendo a leitura do `scope` já existente no controle da tela
- [x] 2.3 Remover o `require` de `mountDependenceGraphStructure` de `index.html` se nenhum outro trecho do arquivo o usar (fluxo `File > Open` não passa por `index.html`, então checar antes de remover) — confirmado: só existia essa única referência, já substituída na 2.2

## 4. Bug do teste manual: física do vis-network não estabiliza

- [x] 4.1 `index.html` (`renderGraph`): configurar `physics: { stabilization: { iterations: 200 } }` na criação do `Network` e desligar a física (`network.setOptions({ physics: false })`) no evento `stabilizationIterationsDone`, corrigindo os nós "dançando" indefinidamente em grafos maiores/com ciclo após a expansão de múltiplos níveis — ver `design.md`
- [x] 4.2 Confirmado manualmente pelo usuário (`yarn start`): o grafo estabiliza e para de se mexer depois de renderizado

## 3. Verificação manual

- [x] 3.1 Rodar `yarn test` e confirmar suíte verde — `npx jest` (yarn indisponível no sandbox): 5 suítes, 22 testes, todos passando
- [x] 3.2 Sandbox sem `DISPLAY`/`Xvfb` impede rodar `yarn start` (Electron real); verificado o equivalente "como Web" — script inline de `index.html` extraído e executado num `jsdom` com `require` mockado (fs/path/model reais; `electron-store` e `vis-network` stubados), simulando clique real na Root Unit `UnitPrincipal` (→ `UnitA` → `UnitB` → `Vcl.Forms` externa, + `UnitC` só com `interfaceAndImplementation`). Confirmado: transição de tela, `store.view` = `graph`, `projectUnits`/`projectDir` limpos do store, e o grafo entregue ao `Network` com os nós/edges corretos e `group` (`projectUnit`/`externalUnit`) certo nos dois escopos. Não cobre a renderização visual em canvas real (sem display) — só a lógica de wiring/dados
