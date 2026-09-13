## 1. Fixture de teste com `uses` na `interface` e na `implementation`

- [x] 1.1 Criar `src/test/sourceUsesInInterfaceAndImplementation.pas`: uma
      `unit` com `uses` na `interface` (units distintos dos da
      `implementation`) e um segundo `uses` dentro da `implementation`,
      para provar que o escopo realmente filtra por seção

## 2. Escopo como constante nomeada

- [x] 2.1 Adicionar `USES_CLAUSE_SCOPE` (`{ INTERFACE:
      'interface', INTERFACE_AND_IMPLEMENTATION:
      'interfaceAndImplementation' }`) — implementado em
      `src/model/parsePascalSource/usesClauseScope.js` (arquivo próprio,
      seguindo o padrão de um símbolo por arquivo já usado por
      `getUnitName.js`/`selectUsesFromSource.js`), importado por
      `selectUsesFromSource.js`
- [x] 2.2 Exportar `USES_CLAUSE_SCOPE` também em
      `src/model/parsePascalSource/index.js`, junto de
      `selectUsesFromSource` e `getUnitName`

## 3. `selectUsesFromSource` ciente de seção

- [x] 3.1 Localizar as seções `interface`/`implementation` no source via
      split por regex de word-boundary (`\binterface\b`,
      `\bimplementation\b`, case-insensitive)
- [x] 3.2 Extrair a lista de units de uma seção reaproveitando o regex de
      cláusula `uses` existente, retornando array vazio (não lançar)
      quando a seção não tem `uses`
- [x] 3.3 Adicionar segundo parâmetro `scope = USES_CLAUSE_SCOPE.INTERFACE`
      a `selectUsesFromSource`: no escopo `INTERFACE`, retorna só a lista
      da seção `interface` (comportamento idêntico ao atual); no escopo
      `INTERFACE_AND_IMPLEMENTATION`, retorna a lista da `interface`
      seguida da `implementation`, deduplicada case-insensitive mantendo a
      primeira ocorrência

## 4. Testes

- [x] 4.1 Manter o teste existente (`get list of uses in interface`)
      passando sem alteração — valida que o default preserva o
      comportamento atual
- [x] 4.2 Novo teste: escopo `INTERFACE` no fixture novo retorna só os
      units da seção `interface`, excluindo os da `implementation`
- [x] 4.3 Novo teste: escopo `INTERFACE_AND_IMPLEMENTATION` no fixture
      novo retorna os units das duas seções combinados, sem duplicatas
      (incluiu também um teste extra inline para o caso de a mesma unit
      aparecer nas duas seções)
- [x] 4.4 Novo teste: escopo `INTERFACE_AND_IMPLEMENTATION` no fixture
      existente (`souceUsesInInterface.pas`, sem `uses` na
      `implementation`) retorna a mesma lista que o escopo `INTERFACE` —
      confirma que uma seção vazia não quebra o merge

## 5. Verificação

- [x] 5.1 Rodado `./node_modules/.bin/jest` (suíte completa, não só o
      arquivo): 20/20 testes passando em 5 suítes. (Precisou antes rodar
      `npm install` para corrigir um binário nativo opcional do
      `unrs-resolver` ausente para `linux-arm64-gnu` — problema de
      ambiente do sandbox, não relacionado ao código deste change.)
- [x] 5.2 Confirmado: nenhum call site existente
      (`Menu/index.js`, `index.html`, `mountDependenceGraphStructure`,
      `expandDependencyGraph`) precisou de alteração — todos continuam
      chamando `selectUsesFromSource(source)` com um argumento só
