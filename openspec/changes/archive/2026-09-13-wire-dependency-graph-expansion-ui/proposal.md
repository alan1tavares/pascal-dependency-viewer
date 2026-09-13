## Why

O `CONTEXT.md` define o Dependency Graph como a expansão transitiva de uma
Root Unit em um DAG deduplicado — mas a tela de seleção de Root Unit
(`rootUnitSelection`, em `index.html`) ainda chama `mountDependenceGraphStructure`,
que só monta a Root Unit e suas dependências diretas (1 nível). A função
`expandDependencyGraph`, que já implementa a expansão recursiva completa
(testada: DAG deduplicado, diamantes, ciclos, classificação de External
Unit), existe no model layer desde a change `2026-09-12-expand-dependency-graph`
mas nunca foi chamada por nenhum código de UI — ela ficou órfã por decisão
explícita de escopo daquela change. O mesmo vale para o Uses Clause Scope:
`expandDependencyGraph` chama `selectUsesFromSource(source)` internamente
sem repassar o `scope`, então mesmo depois de ligada à UI ela sempre usaria
`interface`, ignorando o controle de escopo já existente na tela.

## What Changes

- `index.html` (`selectRootUnit`) passa a chamar `expandDependencyGraph`
  em vez de `mountDependenceGraphStructure`, injetando um `readFile` que
  resolve o caminho de cada Project Unit a partir do `projectDir` aberto
  (mesma resolução de caminho já usada para a Root Unit) e lê o arquivo do
  disco com `fs.readFileSync`.
- `expandDependencyGraph` passa a aceitar um parâmetro `scope` e repassá-lo
  para `selectUsesFromSource` em cada iteração do laço de expansão — tanto
  para a Root Unit quanto para toda Project Unit alcançada
  transitivamente — em vez de usar sempre o padrão (`interface`).
- O valor lido do controle de Uses Clause Scope da tela no momento do
  clique passa a ser repassado até `expandDependencyGraph`, valendo para
  toda a expansão (não só para a Root Unit).
- Fora de escopo nesta change: alterar o fluxo `File > Open` de um `.pas`
  avulso — ele continua mostrando 1 nível via `mountDependenceGraphStructure`,
  já que não há um Projeto (`.dpr`) do qual expandir Project Units.
  Também fora de escopo: mudar o formato de `{ nodes, edges }` ou a
  classificação visual de External Unit, ambos já corretos e reaproveitados
  sem alteração.

## Capabilities

### New Capabilities
(nenhuma)

### Modified Capabilities
- `root-unit-selection`: o requirement "Seleção de uma Root Unit renderiza
  seu grafo de dependências direto" muda de "grafo de 1 nível" para o
  Dependency Graph completo (expansão transitiva via `expandDependencyGraph`),
  mantendo a classificação de External Unit e o respeito ao Uses Clause
  Scope escolhido — agora aplicado a toda a expansão, não só ao primeiro
  nível.
- `dependency-graph-expansion`: a função de expansão passa a receber um
  parâmetro `scope` e repassá-lo para `selectUsesFromSource` em cada
  unidade visitada, em vez de sempre extrair `uses` no escopo padrão
  (`interface`).

## Impact

- `index.html`: `selectRootUnit` troca a chamada de
  `mountDependenceGraphStructure` por `expandDependencyGraph`, com um
  `readFile` injetado (`path => fs.readFileSync(path.resolve(projectDir, path), 'utf-8')`)
  e o `scope` lido do controle já existente na tela.
- `src/model/expandDependencyGraph/index.js`: assinatura ganha um
  parâmetro `scope`, repassado às duas chamadas de `selectUsesFromSource`
  (Root Unit e cada Project Unit da fila de expansão).
- `src/model/expandDependencyGraph/index.test.js`: novos casos cobrindo o
  repasse do `scope` (ex.: dependência só em `implementation` aparece na
  expansão apenas quando `scope` é `interfaceAndImplementation`).
- Nenhuma mudança em `mountDependenceGraphStructure`, `parseDprSource`,
  `classifyExternalUnits` ou no fluxo `File > Open`.
