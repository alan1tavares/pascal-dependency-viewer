## Why

O `CONTEXT.md` define **Uses Clause Scope**: se um walk de Dependency Graph
segue só o `uses` da seção `interface`, ou também o da `implementation`.
Hoje `selectUsesFromSource` não faz essa distinção — o regex casa qualquer
`uses ... ;` do arquivo inteiro e pega o primeiro match, que por acidente
costuma ser o da `interface` (porque ela vem primeiro no arquivo), mas não
por reconhecer a seção. Um `.pas` sem `uses` na `interface` mas com `uses`
na `implementation` já quebraria essa suposição hoje, mesmo sem nenhum
scope "both" existir ainda.

Isso é a trilha 3 do `docs/TODO.md`: resolver o Uses Clause Scope no
parsing é pré-requisito para a futura expansão do grafo poder oferecer as
duas opções sem herdar essa ambiguidade — hoje `expandDependencyGraph`
(ainda não ligado à UI) e o fluxo de 1 nível já chamam
`selectUsesFromSource` assumindo implicitamente "só a primeira cláusula
`uses` do arquivo".

## What Changes

- `selectUsesFromSource` passa a receber um segundo parâmetro opcional de
  escopo, com dois valores possíveis (linguagem do `CONTEXT.md`):
  `interface` (padrão, comportamento atual preservado) e
  `interfaceAndImplementation`.
- Em vez de casar `uses ... ;` no arquivo inteiro e pegar o primeiro match,
  a função primeiro localiza os limites das seções `interface` e
  `implementation` no source, e extrai a cláusula `uses` de cada seção
  separadamente — corrigindo a suposição frágil de "a primeira cláusula do
  arquivo é sempre a da interface".
- Quando o escopo é `interfaceAndImplementation`, os units das duas seções
  são combinados numa lista única, sem duplicatas (comparação
  case-insensitive), preservando a ordem de primeira aparição.
- Uma seção sem cláusula `uses` (ex.: `implementation` sem nenhum `uses`,
  caso já comum e coberto pelo fixture de teste existente) contribui lista
  vazia para o merge, em vez de lançar exceção.
- Fora de escopo nesta change: expor um seletor de Uses Clause Scope na
  tela de busca/listagem (`root-unit-selection`) e passar esse valor
  adiante para `mountDependenceGraphStructure` ou `expandDependencyGraph`.
  Nenhuma UI existe hoje para essa escolha "por geração" que o
  `CONTEXT.md` descreve, e nenhum dos dois fluxos de montagem de grafo
  ainda está preparado para receber um escopo — ligar essas pontas fica
  para uma change futura, seguindo o mesmo padrão incremental das changes
  anteriores (`dpr-project-parsing` e `dependency-graph-expansion` também
  ficaram órfãs da UI até serem conectadas depois).

## Capabilities

### New Capabilities
- `uses-clause-scope`: extração do `uses` de um `.pas` com reconhecimento
  explícito das seções `interface`/`implementation`, parametrizada por um
  escopo (`interface` ou `interfaceAndImplementation`).

### Modified Capabilities
_Nenhuma — `dpr-project-parsing`, `external-unit-classification`,
`root-unit-selection` e `dependency-graph-expansion` continuam chamando
`selectUsesFromSource` sem passar o novo parâmetro, herdando o
comportamento padrão (`interface`), idêntico ao de hoje._

## Impact

- `src/model/parsePascalSource/selectUsesFromSource.js`: reescrita da
  extração para ser ciente de seção, com novo parâmetro de escopo.
- `src/model/parsePascalSource/index.js`: exporta a constante do escopo
  (`interface` / `interfaceAndImplementation`) junto de
  `selectUsesFromSource` e `getUnitName`.
- Novo fixture de teste `.pas` com `uses` tanto na `interface` quanto na
  `implementation`, complementando o fixture existente
  (`souceUsesInInterface.pas`, que não tem `uses` na `implementation` e
  continua validando o caso padrão).
- Nenhuma mudança em `src/components`, `index.html`,
  `mountDependenceGraphStructure` ou `expandDependencyGraph` — todos
  continuam chamando `selectUsesFromSource(source)` sem o segundo
  argumento.
