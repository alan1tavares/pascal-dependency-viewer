## Purpose

Extrair as units referenciadas em cláusulas `uses` de um source Pascal,
distinguindo explicitamente as declaradas na seção `interface` das
declaradas na seção `implementation`, e reportando para cada unit única
encontrada sua Uses Clause Origin — a base de parsing para o View Filter
descrito no `CONTEXT.md`.

## ADDED Requirements

### Requirement: Extração das units de `uses` com sua Uses Clause Origin
O sistema SHALL extrair as units referenciadas em cláusulas `uses` tanto
da seção `interface` quanto da seção `implementation` de um source
Pascal, e retornar, para cada unit única encontrada (comparação
case-insensitive), sua Uses Clause Origin: `interface` (declarada só na
seção `interface`), `implementation` (declarada só na seção
`implementation`), ou `both` (declarada em ambas). O sistema não SHALL
exigir nem aceitar um parâmetro de escopo que decida quais seções
considerar — o resultado sempre cobre as duas.

#### Scenario: Unit declarada só na `interface`
- **WHEN** um `.pas` tem `uses UnitA` na seção `interface` e nenhum
  `uses UnitA` na seção `implementation`
- **THEN** o resultado contém `UnitA` com origem `interface`

#### Scenario: Unit declarada só na `implementation`
- **WHEN** um `.pas` tem `uses UnitB` na seção `implementation` e nenhum
  `uses UnitB` na seção `interface`
- **THEN** o resultado contém `UnitB` com origem `implementation`

#### Scenario: Mesma unit declarada nas duas seções
- **WHEN** a seção `interface` tem `uses UnitA` e a seção
  `implementation` também tem `uses UnitA` (mesmo nome, qualquer
  combinação de maiúsculas/minúsculas)
- **THEN** o resultado contém uma única entrada para `UnitA`, com origem
  `both`

#### Scenario: Seção `implementation` sem `uses`
- **WHEN** a seção `interface` tem `uses UnitA, UnitB` e a seção
  `implementation` não tem nenhuma cláusula `uses`
- **THEN** o resultado contém `UnitA` e `UnitB`, ambas com origem
  `interface`, sem lançar exceção pela ausência de `uses` na
  `implementation`

### Requirement: Uma entrada por unit única, ordenada pela primeira aparição
O sistema SHALL retornar no máximo uma entrada por unit única (comparação
case-insensitive), mesmo quando ela aparece mais de uma vez na mesma
seção ou nas duas seções, ordenada pela ordem de primeira aparição
considerando a seção `interface` antes da `implementation`.

#### Scenario: Units diferentes em cada seção, ordem preservada
- **WHEN** a seção `interface` tem `uses UnitA, UnitB` e a seção
  `implementation` tem `uses UnitC`
- **THEN** o resultado lista `UnitA`, `UnitB`, `UnitC`, nessa ordem, com
  origens `interface`, `interface`, `implementation` respectivamente

#### Scenario: Unit repetida na mesma seção
- **WHEN** a seção `interface` tem `uses UnitA, UnitA` (repetida)
- **THEN** o resultado contém uma única entrada para `UnitA`, com origem
  `interface`
