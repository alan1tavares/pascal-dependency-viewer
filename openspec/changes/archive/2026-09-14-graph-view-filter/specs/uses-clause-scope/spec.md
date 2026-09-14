## REMOVED Requirements

### Requirement: Extração do `uses` ciente da seção (`interface`/`implementation`)
**Reason**: Substituído por extração que sempre cobre as duas seções e
reporta a origem de cada unit, em vez de filtrar por um escopo pedido.
**Migration**: Use a extração de `uses-clause-origin`, que retorna toda
unit encontrada com sua Uses Clause Origin (`interface`,
`implementation`, ou `both`).

### Requirement: Escopo `interfaceAndImplementation` combina as duas seções
**Reason**: Não existe mais um escopo a pedir — a extração sempre reporta
as units das duas seções, cada uma com sua origem, em vez de combiná-las
numa lista só quando um escopo específico é solicitado.
**Migration**: Leia a origem de cada unit no resultado de
`uses-clause-origin` em vez de solicitar o escopo
`interfaceAndImplementation`.

### Requirement: Escopo padrão é `interface`
**Reason**: Não há mais um padrão que restringe a extração a uma seção —
o resultado sempre cobre `interface` e `implementation`.
**Migration**: Filtre o resultado de `uses-clause-origin` por
`origin === 'interface'` caso só as units da seção `interface` sejam
necessárias.
