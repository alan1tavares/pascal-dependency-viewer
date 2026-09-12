# dependency-graph-expansion

## Purpose

Expandir recursivamente um Root Unit por todas as Project Units
alcançáveis via `uses`, produzindo o Dependency Graph completo (um DAG
deduplicado, não uma árvore) no mesmo formato de `{ nodes, edges }` usado
pelo grafo de 1 nível.

## Requirements

### Requirement: Expansão recursiva de um Root Unit em um Dependency Graph
O sistema SHALL fornecer uma função pura que recebe o nome de uma Root
Unit, a lista de Project Units de um Projeto (`{ unitName, path }[]`,
formato de `parseDprSource`) e uma função `readFile(path) => source`
injetada, e retorna a estrutura `{ nodes, edges }` (mesmo formato de
`mountDependenceGraphStructure`) representando o Dependency Graph completo
alcançável a partir da Root Unit: a Root Unit, cada Project Unit atingida
transitivamente por `uses`, e cada External Unit referenciada como nó
folha.

#### Scenario: Expansão de duas camadas via Project Unit intermediária
- **WHEN** a Root Unit `UnitA` tem `uses UnitB`, `UnitB` é uma Project
  Unit e tem `uses UnitC`, e `UnitC` é uma Project Unit sem outras
  dependências
- **THEN** o resultado contém nós para `UnitA`, `UnitB` e `UnitC`, e edges
  `UnitA -> UnitB` e `UnitB -> UnitC`

#### Scenario: External Unit encontrada durante a expansão não é lida do disco
- **WHEN** a Root Unit `UnitA` tem `uses Vcl.Forms`, e `Vcl.Forms` não
  está presente na lista de Project Units do Projeto
- **THEN** o resultado contém um nó folha para `Vcl.Forms` classificado
  como External Unit, e `readFile` nunca é chamado com um caminho para
  `Vcl.Forms`

### Requirement: Cada unidade é visitada no máximo uma vez (DAG, não árvore)
Quando a mesma Project Unit é alcançável por mais de um caminho a partir
da Root Unit, o sistema SHALL criar apenas um nó para ela, lendo seu
arquivo e expandindo suas próprias dependências uma única vez; toda
referência adicional a essa unidade SHALL gerar apenas um edge adicional
apontando para o nó já existente, sem duplicar a subárvore de dependências
nem gerar uma segunda leitura do arquivo.

#### Scenario: Dependência em diamante (duas units dependem da mesma terceira)
- **WHEN** a Root Unit `UnitA` tem `uses UnitB, UnitC`, e tanto `UnitB`
  quanto `UnitC` (ambas Project Units) têm `uses UnitD`
- **THEN** o resultado contém um único nó para `UnitD`, com dois edges
  apontando para ele (`UnitB -> UnitD` e `UnitC -> UnitD`), e `readFile` é
  chamado exatamente uma vez para o caminho de `UnitD`

#### Scenario: Ciclo direto entre duas Project Units
- **WHEN** a Root Unit `UnitA` tem `uses UnitB`, e `UnitB` (Project Unit)
  tem `uses UnitA` de volta
- **THEN** o resultado contém exatamente um nó para `UnitA` e um para
  `UnitB`, com edges `UnitA -> UnitB` e `UnitB -> UnitA`, e a expansão
  termina sem recursão infinita

### Requirement: Classificação de cada dependência encontrada na expansão
Toda dependência direta descoberta durante a expansão — inclusive as de
units que não são a Root Unit — SHALL ser classificada como Project Unit
ou External Unit da mesma forma que a expansão de 1 nível já faz
(comparando o nome, case-insensitive, contra a lista de Project Units do
Projeto), e o nó resultante SHALL carregar essa classificação.

#### Scenario: Dependência de uma Project Unit intermediária é External Unit
- **WHEN** a Root Unit `UnitA` tem `uses UnitB` (Project Unit), e `UnitB`
  tem `uses Vcl.Forms`
- **THEN** o nó `Vcl.Forms` no resultado é classificado como External
  Unit, mesmo não sendo dependência direta da Root Unit
