## MODIFIED Requirements

### Requirement: Expansão recursiva de um Root Unit em um Dependency Graph
O sistema SHALL fornecer uma função pura que recebe o nome de uma Root
Unit, a lista de Project Units de um Projeto (`{ unitName, path }[]`,
formato de `parseDprSource`) e uma função `readFile(path) => source`
injetada, e retorna a estrutura `{ nodes, edges }` representando o
Dependency Graph completo alcançável a partir da Root Unit: a Root Unit,
cada Project Unit atingida transitivamente por `uses`, e cada External
Unit referenciada como nó folha. A função SHALL sempre seguir tanto as
declarações `uses` da seção `interface` quanto as da seção
`implementation` de toda unidade visitada durante a expansão — a Root
Unit e cada Project Unit alcançada transitivamente — sem receber nem
precisar de nenhum parâmetro de escopo.

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
  `interface`, e `UnitB` tem `uses UnitC` (Project Unit) só na seção
  `implementation`
- **THEN** o resultado contém os edges `UnitA -> UnitB` e `UnitB -> UnitC`,
  confirmando que a extração de ambas as seções — sem nenhum parâmetro de
  escopo — se aplica a toda unidade visitada, não só à Root Unit

#### Scenario: `scope` omitido usa `interface` como padrão em toda a expansão
- **WHEN** a Root Unit `UnitA` tem `uses UnitB` só na seção
  `implementation`, e nenhum `uses UnitB` na seção `interface`
- **THEN** o resultado contém o nó `UnitB` e o edge `UnitA -> UnitB`, já
  que não existe mais um parâmetro de escopo que restrinja a extração à
  seção `interface`

## ADDED Requirements

### Requirement: Cada edge do Dependency Graph carrega sua Uses Clause Origin
O sistema SHALL marcar cada edge do resultado com a Uses Clause Origin
(`interface`, `implementation`, ou `both`) da(s) declaração(ões) `uses`
que a originaram, permitindo que quem consome o Dependency Graph saiba de
qual seção (ou de ambas) da unidade de origem aquela dependência foi
declarada.

#### Scenario: Edge originado só na seção `interface`
- **WHEN** a unidade `UnitA` tem `uses UnitB` só na seção `interface`
- **THEN** o edge `UnitA -> UnitB` no resultado carrega origem
  `interface`

#### Scenario: Edge originado só na seção `implementation`
- **WHEN** a unidade `UnitA` tem `uses UnitB` só na seção
  `implementation`
- **THEN** o edge `UnitA -> UnitB` no resultado carrega origem
  `implementation`

#### Scenario: Edge originado nas duas seções vira um único edge com origem combinada
- **WHEN** a unidade `UnitA` tem `uses UnitB` tanto na seção `interface`
  quanto na seção `implementation`
- **THEN** o resultado contém um único edge `UnitA -> UnitB`, com origem
  `both`, e não dois edges separados
