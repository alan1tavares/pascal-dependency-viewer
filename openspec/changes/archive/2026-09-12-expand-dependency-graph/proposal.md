## Why

Hoje, mesmo depois de escolher uma Root Unit (`root-unit-selection`), o app
só renderiza 1 nível: a unidade e suas dependências diretas. O `CONTEXT.md`
define "Dependency Graph" como a expansão transitiva de um Root Unit por
todas as Project Units alcançáveis, deduplicada em um DAG — mas nenhum
código hoje caminha recursivamente pelos `uses` de cada Project Unit
descoberta. Sem isso, a Root Unit selection entrega uma tela de escolha que
não muda o resultado final em relação a um `File > Open` avulso.

## What Changes

- Nova função pura no model layer que, dado um nome de Root Unit, a lista
  de Project Units de um `.dpr` (`{ unitName, path }[]`) e uma função
  `readFile(path) => source` injetada, expande recursivamente o grafo de
  dependências:
  - Para cada Project Unit visitada, lê seu `.pas` (via `readFile`),
    extrai seu `uses` (via `parsePascalSource`) e continua a expansão a
    partir de cada dependência que também for uma Project Unit.
  - Classifica cada dependência como Project Unit ou External Unit
    (reaproveitando `classifyExternalUnits`); External Unit vira nó folha
    e não é expandida.
  - Cada unit é visitada no máximo uma vez: se uma dependência já
    expandida for referenciada de novo por outra unit, o resultado ganha
    apenas um edge de volta ao nó existente, não uma subárvore duplicada
    — preservando o formato DAG mesmo diante de dependências em diamante
    ou ciclos.
  - Retorna a estrutura `{ nodes, edges }` no mesmo formato de
    `mountDependenceGraphStructure`, pronta para o `vis-network` consumir.
- Fora de escopo nesta change: ligar essa expansão à UI (`root-unit-selection`
  hoje renderiza só 1 nível e continua assim até uma change futura), e
  resolver o Uses Clause Scope (`interface` vs `implementation`) —
  `selectUsesFromSource` continua sendo usado como está, com sua
  ambiguidade atual herdada pela expansão.

## Capabilities

### New Capabilities
- `dependency-graph-expansion`: expansão recursiva e deduplicada (DAG) de
  um Root Unit por suas Project Units alcançáveis, no model layer, com
  leitura de arquivo injetada e classificação de External Unit reutilizada
  de `external-unit-classification`.

### Modified Capabilities
(nenhuma — as capabilities existentes, `dpr-project-parsing`,
`external-unit-classification` e `root-unit-selection`, são reaproveitadas
sem alteração de seus requisitos.)

## Impact

- Novo módulo em `src/model` (ex.: `src/model/expandDependencyGraph`),
  seguindo o padrão de lógica pura já usado por `parseDprSource`,
  `classifyExternalUnits` e `mountDependenceGraphStructure`.
- Reaproveita `parsePascalSource` (`getUnitName` + `selectUsesFromSource`)
  e `classifyExternalUnits` sem modificá-los.
- Não altera `src/components` nem o fluxo `File > Open` existente — a nova
  função fica desconectada da UI até uma change futura decidir como
  acionar a expansão a partir da tela de Root Unit selection.
