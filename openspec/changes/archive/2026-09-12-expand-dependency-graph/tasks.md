## 1. Estrutura do módulo

- [x] 1.1 Criar `src/model/expandDependencyGraph/index.js` com a assinatura
      `expandDependencyGraph(rootUnitName, projectUnits, readFile)`,
      seguindo o padrão de módulo puro dos demais diretórios em
      `src/model` (ex.: `mountDependenceGraphStructure`).
- [x] 1.2 Criar `src/test/expandDependencyGraph.test.js`, com um `readFile`
      fake em memória (`{ [path]: source }`) reutilizável entre os testes.

## 2. Travessia básica (caminho feliz)

- [x] 2.1 Implementar a leitura da Root Unit a partir de `projectUnits`
      (achar o `path` pelo `unitName`, case-insensitive) e a extração de
      nome/`uses` via `parsePascalSource`.
- [x] 2.2 Implementar a fila/pilha de expansão com `Map` de visitados por
      nome normalizado (lowercase), cobrindo o cenário "Expansão de duas
      camadas via Project Unit intermediária" da spec.
- [x] 2.3 Integrar `classifyExternalUnits` a cada nível da expansão para
      decidir, por dependência, se ela é Project Unit (entra na fila) ou
      External Unit (vira nó folha, não expande), cobrindo os cenários
      "External Unit encontrada durante a expansão não é lida do disco" e
      "Dependência de uma Project Unit intermediária é External Unit".

## 3. Deduplicação e ciclos

- [x] 3.1 Garantir que uma Project Unit já visitada não seja lida nem
      expandida de novo, apenas recebendo edges adicionais — cobrir o
      cenário "Dependência em diamante".
- [x] 3.2 Garantir que a Root Unit seja marcada como visitada antes de
      iniciar a expansão de suas dependências, para que um ciclo de volta
      a ela não recurse infinitamente — cobrir o cenário "Ciclo direto
      entre duas Project Units".

## 4. Formato de saída

- [x] 4.1 Montar `nodes`/`edges` no mesmo formato de
      `mountDependenceGraphStructure` (`id` lowercase, `label` com a
      grafia original, `group: 'projectUnit' | 'externalUnit'`, edges com
      `from`/`to` lowercase).

## 5. Verificação

- [x] 5.1 Rodar `yarn test` e confirmar que todos os cenários da spec
      `dependency-graph-expansion` (incluindo diamante e ciclo) passam,
      sem regressão nos testes existentes de `classifyExternalUnits`,
      `mountDependenceGraphStructure` e `parseDprSource`.
