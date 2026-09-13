## MODIFIED Requirements

### Requirement: Expansão recursiva de um Root Unit em um Dependency Graph
O sistema SHALL fornecer uma função pura que recebe o nome de uma Root
Unit, a lista de Project Units de um Projeto (`{ unitName, path }[]`,
formato de `parseDprSource`), uma função `readFile(path) => source`
injetada e um `scope` opcional de Uses Clause Scope (`interface` ou
`interfaceAndImplementation`, usando `interface` como padrão quando
omitido), e retorna a estrutura `{ nodes, edges }` (mesmo formato de
`mountDependenceGraphStructure`) representando o Dependency Graph completo
alcançável a partir da Root Unit: a Root Unit, cada Project Unit atingida
transitivamente por `uses`, e cada External Unit referenciada como nó
folha. O `scope` informado SHALL ser aplicado à extração do `uses` de toda
unidade visitada durante a expansão — a Root Unit e cada Project Unit
alcançada transitivamente — e não apenas à Root Unit.

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

#### Scenario: `scope` se aplica também a Project Units intermediárias, não só à Root Unit
- **WHEN** a Root Unit `UnitA` tem `uses UnitB` (Project Unit) na seção
  `interface`, `UnitB` tem `uses UnitC` (Project Unit) só na seção
  `implementation`, e a expansão é chamada com
  `scope: 'interfaceAndImplementation'`
- **THEN** o resultado contém os edges `UnitA -> UnitB` e `UnitB -> UnitC`

#### Scenario: `scope` omitido usa `interface` como padrão em toda a expansão
- **WHEN** a Root Unit `UnitA` tem `uses UnitB` só na seção
  `implementation`, e a expansão é chamada sem informar `scope`
- **THEN** o resultado contém apenas o nó `UnitA`, sem edge para `UnitB`
