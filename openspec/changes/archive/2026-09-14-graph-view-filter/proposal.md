## Why

Hoje a escolha entre "Interface" e "Interface + Implementation" é um radio
button na tela de busca/listagem, lido uma única vez no momento em que o
usuário clica numa Project Unit — trocar de ideia depois de o grafo estar
na tela exige voltar à listagem e escolher a Root Unit de novo. Queremos
que essa escolha vire um filtro ao vivo na própria tela do grafo, sem
precisar reabrir nem reler nada do disco.

## What Changes

- Remove o radio button `usesScope` da tela de busca/listagem
  (`#rootUnitSelection`). Essa tela passa a ter só o filtro de texto e a
  lista de Project Units.
- Adiciona um painel flutuante compacto, ancorado no canto superior
  direito da tela do grafo, com dois checkboxes independentes —
  "Interface" e "Implementação" — que juntos formam o View Filter da
  sessão de visualização atual (não persistido).
- **BREAKING**: `selectUsesFromSource` deixa de receber um parâmetro de
  `scope` e deixa de retornar uma lista achatada de nomes; passa a
  retornar, para cada unit referenciada em `uses` (em qualquer seção), a
  sua Uses Clause Origin (`interface`, `implementation`, ou ambas).
- **BREAKING**: `expandDependencyGraph` deixa de receber `scope` — a
  expansão a partir da Root Unit sempre segue tanto `interface` quanto
  `implementation` de cada unidade visitada. Cada edge do resultado passa
  a carregar sua Uses Clause Origin (`{ from, to, origin }` em vez de
  `{ from, to }`).
- **BREAKING**: o IPC `expandFromRootUnit` deixa de receber `scope` do
  renderer, já que a expansão não tem mais essa escolha.
- Ao interagir com o View Filter, o grafo já renderizado é atualizado
  dinamicamente (client-side, via `vis-network`), sem nova chamada IPC:
  arestas cuja Uses Clause Origin não estiver marcada somem, e todo node
  que fica sem nenhuma aresta visível some também — exceto a Root Unit,
  que permanece sempre visível.
- Pelo menos um dos dois checkboxes do View Filter fica sempre marcado
  (não é possível desmarcar os dois); ambos iniciam marcados.

## Capabilities

### New Capabilities
- `uses-clause-origin`: extrai as units referenciadas em `uses` das
  seções `interface` e `implementation` de um source Pascal, reportando
  para cada uma sua origem (interface, implementation, ou ambas) em vez
  de aceitar um parâmetro de escopo que decide o que considerar.
- `graph-view-filter`: painel flutuante na tela do grafo com dois
  checkboxes independentes (Interface/Implementação) que filtram
  dinamicamente, por Uses Clause Origin, quais arestas e nodes do
  Dependency Graph já carregado ficam visíveis.

### Modified Capabilities
- `uses-clause-scope`: todos os requirements são removidos — a extração
  com escolha de escopo é substituída pela extração sempre-completa com
  origem por unidade (`uses-clause-origin`).
- `dependency-graph-expansion`: a expansão deixa de receber `scope` e
  sempre segue interface + implementation; cada edge do resultado passa a
  carregar sua Uses Clause Origin.
- `root-unit-selection`: remove o controle de Uses Clause Scope da tela
  de busca/listagem; a seleção de uma Root Unit sempre produz o
  Dependency Graph completo (ambas as origens), e o que fica visível ao
  usuário passa a ser decidido pelo View Filter na tela do grafo.

## Impact

- `src/domain/parsePascalSource/selectUsesFromSource.js` e
  `usesClauseScope.js`: reescritos para reportar origem por unidade em
  vez de aceitar `scope`.
- `src/domain/expandDependencyGraph/index.js`: remove o parâmetro
  `scope`, sempre expande as duas seções, tagueia cada edge com sua Uses
  Clause Origin.
- `src/main/ipc/graph.js` (`performExpandFromRootUnit`/
  `expandFromRootUnit`) e `src/preload/api.js`: removem o parâmetro
  `scope` do contrato IPC.
- `src/renderer/components/rootUnitSelection.js` e `index.html`: removem
  o HTML/JS do radio `usesScope`.
- `src/renderer/components/graphView.js` e `index.html`: novo painel
  flutuante de View Filter e a lógica de filtragem dinâmica no
  `vis-network`.
- `src/domain/test/*` cobrindo `selectUsesFromSource` e
  `expandDependencyGraph`: atualizados para o novo contrato.
- `openspec/specs/uses-clause-scope/spec.md`,
  `openspec/specs/dependency-graph-expansion/spec.md` e
  `openspec/specs/root-unit-selection/spec.md`: atualizados pelas specs
  desta change.
- `docs/SUGGESTION.md`: a sugestão pendente de envolver
  `#usesScopeControl` num `<fieldset>` fica obsoleta (o controle é
  removido, não ajustado).
