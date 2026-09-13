## Context

`src/model/**` (8 arquivos) usa `module.exports`/`require(...)`. `src/main.js`,
`src/preload.js` e `src/renderer.js` já usam `import`/`export` nativo e são
processados pelo Vite, que trata sintaxe estática por padrão e só aciona o
plugin `@rollup/plugin-commonjs` (via `build.commonjsOptions`) para arquivos
que usam `module.exports`/`require`. É por isso que `vite.main.config.mjs`
precisa listar `src/model/` em `commonjsOptions.include` hoje.

O outro consumidor de `src/model/**` é a suíte Jest (`src/test/**`), que roda
direto sob Node (sem passar pelo Vite) e hoje usa `require(...)`, porque o
runtime padrão do Jest é CommonJS. Essa é a única razão para o projeto ainda
precisar suportar CJS em algum ponto do pipeline — o Vite, por si, já
aceitaria ESM nativamente sem nenhuma opção extra. Ver proposal.md para o
motivador completo.

## Goals / Non-Goals

**Goals:**
- Converter `src/model/**` para ESM nativo (`export`/`import`), eliminando a
  necessidade do interop CJS no Vite.
- Manter a suíte Jest funcionando (`npm test`) sobre os mesmos arquivos, sem
  reescrever asserts ou comportamento de teste.
- Manter `npm start` / `npm run package` funcionando sem regressão.

**Non-Goals:**
- Não altera nenhuma lógica de parsing/grafo (mesma saída para as mesmas
  entradas).
- Não migra `forge.config.js`/`jest.config.js` para ESM "de verdade" — apenas
  o necessário para conviver com `"type": "module"` no `package.json`.
- Não introduz TypeScript, bundling de testes, nem troca o test runner.

## Decisions

### 1. `src/model/**`: `export default` para módulos de função única, named exports onde já há múltiplos exports

Cada arquivo hoje exporta uma única função via `module.exports = fn` (ex.:
`mountDependenceGraphStructure`, `parseDprSource`, `expandDependencyGraph`,
`classifyExternalUnits`, `getUnitName`, `selectUsesFromSource`) — vira
`export default function ...`, compatível 1:1 com os `import fn from '...'`
que `src/main.js` já usa.

`src/model/parsePascalSource/index.js` hoje faz
`module.exports = { selectUsesFromSource, getUnitName, USES_CLAUSE_SCOPE }` e
é consumido em `src/main.js` como `import { getUnitName, selectUsesFromSource } from "./model/parsePascalSource/index.js"`.
Vira um barrel com named exports (`export { default as getUnitName } from './getUnitName.js'`,
etc.), preservando a mesma forma de importação no `main.js` e nos testes.
`usesClauseScope.js` (hoje `module.exports = USES_CLAUSE_SCOPE`, um objeto)
vira `export default USES_CLAUSE_SCOPE`, re-exportado pelo barrel como named
export `USES_CLAUSE_SCOPE`.

**Alternativa considerada**: exportar tudo como named exports em todo lugar
(inclusive nos módulos de função única). Rejeitada para não forçar mudança
adicional nos pontos de import já existentes em `src/main.js`, que já usa
default import para esses módulos.

### 2. Extensões `.js` explícitas nos imports internos de `src/model/**`

Resolução ESM nativa do Node (usada tanto pelo Jest em modo ESM quanto,
potencialmente, por qualquer execução direta fora do Vite) exige extensão
explícita em imports relativos. O Vite tolera omitir a extensão, mas o Jest
sob Node não. Ex.: `require('../classifyExternalUnits')` vira
`import classifyExternalUnits from '../classifyExternalUnits/index.js'`.

### 3. Jest: ESM nativo escopado a `src/` via `package.json` aninhado, sem tocar em `jest.config.js`/`forge.config.js`

Opções avaliadas para o Jest conseguir carregar `src/model/**` e
`src/test/**` como ESM:

- **Escolhida — `package.json` aninhado em `src/` com `"type": "module"`**:
  criar `src/package.json` contendo só `{ "type": "module" }`. Node e Jest
  resolvem o tipo de módulo (ESM vs. CommonJS) pelo `package.json` mais
  próximo do arquivo sendo carregado — como esse arquivo fica dentro de
  `src/`, ele escopa `"type": "module"` só para `src/model/**` e
  `src/test/**` (e, incidentalmente, `src/main.js`/`src/preload.js`/
  `src/renderer.js`, que já usam sintaxe ESM e não são executados
  diretamente pelo Node, então não são afetados na prática). O
  `package.json` da raiz continua sem o campo `type` (default `commonjs`),
  então `jest.config.js` e `forge.config.js` continuam funcionando sem
  nenhuma alteração. Roda-se o Jest com
  `NODE_OPTIONS=--experimental-vm-modules` (Jest 30, já em
  `devDependencies`, suporta esse modo). Não adiciona dependência nova.
- **Rejeitada — `"type": "module"` na raiz do `package.json` + renomear
  `jest.config.js`/`forge.config.js` para `.cjs`**: resolve o mesmo
  problema, mas expande o escopo da mudança para dois arquivos de
  configuração de ferramenta (Jest, Electron Forge) que não precisam de
  nenhuma alteração de conteúdo — só existiriam porque `"type": "module"`
  na raiz os afeta colateralmente.
- **Rejeitada — `babel-jest` + `@babel/preset-env`**: transpila ESM → CJS só
  para o Jest, sem exigir `"type": "module"` em lugar nenhum. Mas introduz
  uma dependência e uma configuração (`babel.config.*`) só para viabilizar
  um recurso que o Node/Jest já oferecem nativamente — infraestrutura extra
  sem necessidade para um projeto deste porte.

Os arquivos `vite.*.config.mjs` já são `.mjs` e não são afetados por nenhuma
das opções.

### 4. `vite.main.config.mjs`: remover `build.commonjsOptions`

Com `src/model/**` em ESM nativo, o bloco inteiro de `commonjsOptions` deixa
de ter propósito e é removido, voltando a `defineConfig({})`.

## Risks / Trade-offs

- [Risco] Suporte a ESM do Jest depende da flag `--experimental-vm-modules`
  (ainda rotulada experimental) → Mitigação: a flag é fixada no script
  `test` do `package.json` (`NODE_OPTIONS=--experimental-vm-modules jest`),
  então `npm test` continua funcionando sem passo manual; Jest 30 (já na
  versão instalada) tem esse caminho maduro o suficiente para uso em CI/local.
- [Risco] `package.json` aninhado (escopo de `"type": "module"` por
  subárvore) é um recurso do Node menos conhecido que o campo `type` na raiz
  → Mitigação: `src/package.json` fica com um único campo
  (`{ "type": "module" }`), sem mistério de conteúdo; o próprio arquivo
  serve de documentação do porquê ele existe.
- [Risco] Import relativo sem extensão quebra silenciosamente só em tempo de
  teste (Vite é mais tolerante) → Mitigação: `npm test` é a rede de segurança
  — falha alto e imediatamente em qualquer extensão/nome de export omitido;
  rodar `npm test` e `npm start` (ou `npm run package`) antes de concluir a
  implementação.

## Migration Plan

1. Converter `src/model/**` (exports e imports internos) para ESM com
   extensões `.js` explícitas.
2. Converter `src/test/**` de `require(...)` para `import ... from ...`.
3. Criar `src/package.json` com `{ "type": "module" }` (o `package.json` da
   raiz, `jest.config.js` e `forge.config.js` permanecem inalterados).
4. Atualizar o script `test` do `package.json` para incluir
   `NODE_OPTIONS=--experimental-vm-modules`.
5. Remover `build.commonjsOptions` de `vite.main.config.mjs`.
6. Validar com `npm test` (suíte Jest completa) e `npm start` (app abre,
   Open/Open Project/expansão de Root Unit continuam funcionando).

Rollback: reverter o commit da mudança — não há migração de dados nem de
schema envolvida, apenas sintaxe de módulo e configuração de build/test.

## Notas de implementação

Dois ajustes adicionais, não antecipados nas seções acima, foram necessários
para `src/test/**` funcionar como ESM nativo (consequência direta da
Decisão 3, sem opções alternativas de projeto):

- `__dirname` não existe em módulos ESM → `parseDprSource.test.js` e
  `parsePascalSource.test.js` (que usavam `join(__dirname, ...)` para
  localizar fixtures) passaram a usar `import.meta.dirname` (nativo desde
  Node 20.11/21.2).
- O Jest não injeta o global `jest` automaticamente em módulos ESM →
  `expandDependencyGraph.test.js` (que usa `jest.fn(...)`) passou a importar
  explicitamente `import { jest } from '@jest/globals'`.
