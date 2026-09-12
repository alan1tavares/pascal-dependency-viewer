## 1. Classificação de External Unit (model layer)

- [x] 1.1 Criar `src/model/classifyExternalUnits/index.js`: função pura
      `classifyExternalUnits(dependencyNames, projectUnits)` que retorna,
      na mesma ordem de `dependencyNames`, `{ unitName, isExternal }`,
      comparando nomes case-insensitively contra `projectUnits`.
- [x] 1.2 Criar `src/test/classifyExternalUnits.test.js` cobrindo os três
      cenários da spec `external-unit-classification`: dependência é
      Project Unit, dependência é External Unit, comparação
      case-insensitive.

## 2. Anotação dos nós do grafo

- [x] 2.1 Estender `src/model/mountDependenceGraphStructure/index.js` para
      aceitar um terceiro parâmetro opcional `projectUnits`; quando
      presente, usar `classifyExternalUnits` para marcar cada nó de
      dependência com `group: 'externalUnit' | 'projectUnit'`, e marcar o
      nó da unidade principal sempre como `group: 'projectUnit'`. Quando
      `projectUnits` for omitido, manter o formato de nó exatamente como
      hoje (sem campo `group`).
- [x] 2.2 Atualizar `src/test/mountDependenceGraphStructure.test.js` com
      casos cobrindo: chamada sem `projectUnits` (comportamento atual
      preservado) e chamada com `projectUnits` (nós com `group` correto
      para Project Unit e External Unit).

## 3. Renderização visual distinta

- [x] 3.1 Em `index.html`, passar `projectUnits` para
      `mountDependenceGraphStructure` dentro de `selectRootUnit`.
- [x] 3.2 Em `index.html`, configurar `options.groups` do `Network` do
      `vis-network` com estilos distintos para `projectUnit` e
      `externalUnit` (nó folha, visualmente diferenciado).

## 4. Verificação

- [x] 4.1 Rodar `yarn test` e confirmar que todos os testes passam.
- [x] 4.2 Rodar `yarn start`, abrir um `.dpr` de teste, escolher uma Root
      Unit com dependências dentro e fora da lista de Project Units, e
      confirmar visualmente a distinção de estilo entre Project Unit e
      External Unit no grafo renderizado.
