## ADDED Requirements

### Requirement: Classificação de dependências como Project Unit ou External Unit
O sistema SHALL fornecer uma função pura que recebe uma lista de nomes de
unit (dependências diretas extraídas de uma cláusula `uses`) e a lista de
Project Units de um Projeto (`{ unitName, path }[]`), e retorna, na mesma
ordem da lista de entrada, para cada nome se ele corresponde a uma Project
Unit ou é uma External Unit. A comparação de nomes SHALL ser
case-insensitive.

#### Scenario: Dependência corresponde a uma Project Unit
- **WHEN** a lista de dependências é `['UnitB']` e a lista de Project Units
  do Projeto contém `{ unitName: 'UnitB', path: 'UnitB.pas' }`
- **THEN** a função retorna `[{ unitName: 'UnitB', isExternal: false }]`

#### Scenario: Dependência não corresponde a nenhuma Project Unit
- **WHEN** a lista de dependências é `['Vcl.Forms']` e a lista de Project
  Units do Projeto não contém nenhuma entrada com esse nome
- **THEN** a função retorna `[{ unitName: 'Vcl.Forms', isExternal: true }]`

#### Scenario: Comparação de nomes é case-insensitive
- **WHEN** a lista de dependências é `['unitb']` e a lista de Project
  Units do Projeto contém `{ unitName: 'UnitB', path: 'UnitB.pas' }`
- **THEN** a função retorna `[{ unitName: 'unitb', isExternal: false }]`
