## 1. Fixture de teste

- [x] 1.1 Criar `src/test/sourceDprWithProjectUnits.dpr` com um `program`, uma
      cláusula `uses` contendo: pelo menos uma unit sem `in 'path'` (ex.
      `Vcl.Forms`), pelo menos uma Project Unit simples (`UnitA in
      'UnitA.pas'`) e pelo menos uma Project Unit com comentário de form
      (`UnitPrincipal in 'UnitPrincipal.pas' {FormPrincipal}`)

## 2. Implementação do parser

- [x] 2.1 Criar `src/model/parseDprSource/index.js` exportando
      `parseDprSource(source)`
- [x] 2.2 Implementar a extração da região da cláusula `uses` (do `uses` ao
      primeiro `;`), reaproveitando a mesma abordagem de
      `selectUsesFromSource`
- [x] 2.3 Implementar a regex de captura `Identifier in 'path'` com
      comentário `{...}` opcional, retornando `{ unitName, path }` por
      ocorrência
- [x] 2.4 Garantir que entradas sem `in 'path'` são omitidas do resultado

## 3. Testes

- [x] 3.1 Criar `src/test/parseDprSource.test.js`
- [x] 3.2 Teste: `.dpr` com múltiplas Project Units retorna todos os pares
      `{ unitName, path }` esperados
- [x] 3.3 Teste: `unitName` preserva a grafia original (sem lowercase)
- [x] 3.4 Teste: unit sem `in 'path'` (ex. `Vcl.Forms`) não aparece no
      resultado
- [x] 3.5 Teste: entrada com comentário de form (`{FormX}`) é reconhecida e o
      comentário não vaza para `unitName`/`path`

## 4. Verificação

- [x] 4.1 Rodar `yarn test` e confirmar que a suíte inteira passa, incluindo
      os novos testes
