## ADDED Requirements

### Requirement: Extração do `uses` ciente da seção (`interface`/`implementation`)
O sistema SHALL extrair a cláusula `uses` de um source Pascal
reconhecendo explicitamente a seção (`interface` ou `implementation`) em
que ela aparece, em vez de casar a primeira cláusula `uses` do arquivo
inteiro sem distinguir seção.

#### Scenario: Unit com `uses` só na `interface` (caso comum)
- **WHEN** um `.pas` tem `uses` na seção `interface` e nenhum `uses` na
  `implementation`
- **THEN** a extração no escopo `interface` retorna a lista de units da
  seção `interface`, idêntica ao comportamento atual

#### Scenario: Unit com `uses` em ambas as seções, escopo `interface`
- **WHEN** um `.pas` tem `uses` tanto na `interface` quanto na
  `implementation`, com listas de units diferentes em cada seção, e o
  escopo pedido é `interface`
- **THEN** o resultado contém apenas os units da seção `interface`,
  excluindo os que aparecem só na `implementation`

### Requirement: Escopo `interfaceAndImplementation` combina as duas seções
O sistema SHALL fornecer um escopo `interfaceAndImplementation` que
retorna os units da seção `interface` seguidos dos da seção
`implementation`, combinados numa única lista sem duplicatas (comparação
case-insensitive), preservando a ordem de primeira aparição.

#### Scenario: Units diferentes em cada seção
- **WHEN** a seção `interface` tem `uses UnitA, UnitB` e a seção
  `implementation` tem `uses UnitC`, e o escopo pedido é
  `interfaceAndImplementation`
- **THEN** o resultado é `['UnitA', 'UnitB', 'UnitC']`

#### Scenario: Mesma unit referenciada nas duas seções
- **WHEN** a seção `interface` tem `uses UnitA` e a seção `implementation`
  tem `uses UnitA` de novo (mesmo nome, qualquer combinação de
  maiúsculas/minúsculas), e o escopo pedido é
  `interfaceAndImplementation`
- **THEN** o resultado contém `UnitA` uma única vez

#### Scenario: Seção `implementation` sem `uses`
- **WHEN** a seção `interface` tem `uses UnitA, UnitB` e a seção
  `implementation` não tem nenhuma cláusula `uses`, e o escopo pedido é
  `interfaceAndImplementation`
- **THEN** o resultado é `['UnitA', 'UnitB']`, sem lançar exceção pela
  ausência de `uses` na `implementation`

### Requirement: Escopo padrão é `interface`
Quando nenhum escopo é informado, o sistema SHALL usar `interface` como
padrão, preservando o comportamento de extração já existente para todo
call site que não passa o novo parâmetro.

#### Scenario: Chamada sem parâmetro de escopo
- **WHEN** `selectUsesFromSource` é chamado só com o source, sem segundo
  argumento
- **THEN** o resultado é o mesmo que chamá-lo explicitamente com o escopo
  `interface`
