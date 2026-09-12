## Why

O `CONTEXT.md` define **External Unit** (unidade referenciada num `uses` que
não é Project Unit do Projeto aberto — RTL/VCL/terceiros — renderizada como
nó folha, com estilo visualmente distinto). Hoje nenhum nó do grafo é
distinguido: `mountDependenceGraphStructure` trata toda dependência da mesma
forma. O fluxo de Root Unit (`root-unit-selection`) já tem em mãos a lista
de Project Units do `.dpr` aberto no momento em que monta o grafo — dá para
classificar cada dependência direta contra essa lista e diferenciar
visualmente o resultado, sem depender da expansão transitiva (DAG) ainda
não implementada.

## What Changes

- Nova função pura em `src/model` que classifica uma lista de nomes de
  unit (a cláusula `uses` de uma unidade) contra a lista de Project Units
  de um Projeto, retornando para cada nome se é Project Unit ou External
  Unit.
- O passo de montagem do grafo do fluxo de Root Unit passa a anotar cada
  nó de dependência com sua classificação (Project Unit vs External Unit).
- A renderização em `index.html` (vis-network) aplica um estilo visual
  distinto aos nós marcados como External Unit (nó folha, estilo diferente
  dos nós de Project Unit).
- Escopo limitado ao fluxo de Root Unit/Projeto: o fluxo avulso
  `File > Open` não tem lista de Project Units para comparar, então
  continua renderizando todos os nós sem distinção, como hoje.

## Capabilities

### New Capabilities
- `external-unit-classification`: função pura que recebe uma lista de
  nomes de unit e a lista de Project Units de um Projeto, e retorna a
  classificação de cada nome como Project Unit ou External Unit.

### Modified Capabilities
- `root-unit-selection`: o requisito de renderização do grafo ao escolher
  uma Root Unit passa a classificar cada dependência direta como Project
  Unit ou External Unit (usando `external-unit-classification`) e a
  renderizar as External Unit com estilo visual distinto.

## Impact

- `src/model`: novo módulo de classificação + testes.
- `src/model/mountDependenceGraphStructure`: nós passam a carregar a
  classificação (Project Unit vs External Unit) quando essa informação
  está disponível.
- `index.html`: opções de nó do `vis-network` diferenciam visualmente
  External Unit de Project Unit.
- `openspec/specs/root-unit-selection/spec.md`: delta spec para o
  requisito de renderização do grafo da Root Unit.
