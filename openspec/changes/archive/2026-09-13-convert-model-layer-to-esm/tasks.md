## 1. Converter `src/model/**` para ESM nativo

- [x] 1.1 `src/model/classifyExternalUnits/index.js`: trocar `module.exports = classifyExternalUnits` por `export default classifyExternalUnits`.
- [x] 1.2 `src/model/parseDprSource/index.js`: trocar `module.exports = parseDprSource` por `export default parseDprSource`.
- [x] 1.3 `src/model/mountDependenceGraphStructure/index.js`: trocar `require('../classifyExternalUnits')` por `import classifyExternalUnits from '../classifyExternalUnits/index.js'` e `module.exports = mountDependenceGraphStructure` por `export default mountDependenceGraphStructure`.
- [x] 1.4 `src/model/expandDependencyGraph/index.js`: trocar `require('../parsePascalSource')`/`require('../classifyExternalUnits')` pelos `import` equivalentes com extensão `.js` (`import { selectUsesFromSource } from '../parsePascalSource/index.js'`, `import classifyExternalUnits from '../classifyExternalUnits/index.js'`) e `module.exports = expandDependencyGraph` por `export default expandDependencyGraph`.
- [x] 1.5 `src/model/parsePascalSource/getUnitName.js`: trocar `module.exports = getUnitName` por `export default getUnitName`.
- [x] 1.6 `src/model/parsePascalSource/usesClauseScope.js`: trocar `module.exports = USES_CLAUSE_SCOPE` por `export default USES_CLAUSE_SCOPE`.
- [x] 1.7 `src/model/parsePascalSource/selectUsesFromSource.js`: trocar `require('./usesClauseScope')` por `import USES_CLAUSE_SCOPE from './usesClauseScope.js'` e `module.exports = selectUsesFromSource` por `export default selectUsesFromSource`.
- [x] 1.8 `src/model/parsePascalSource/index.js`: trocar os três `require(...)` + `module.exports = {...}` pelo barrel ESM equivalente, preservando os três nomes exportados (implementado como `import`s individuais + `export { selectUsesFromSource, getUnitName, USES_CLAUSE_SCOPE }`, equivalente a `export { default as ... }`).
- [x] 1.9 Verificar que nenhum `require(` ou `module.exports` restou em `src/model/**` (`grep -rn "require(\|module.exports" src/model` retorna vazio).

## 2. Converter `src/test/**` para importar via ESM

- [x] 2.1 `src/test/parseDprSource.test.js`: trocar os três `require(...)` (`fs`, `path`, `../model/parseDprSource`) por `import` equivalentes, com `import parseDprSource from '../model/parseDprSource/index.js'`. Também trocado `__dirname` (inexistente em ESM) por `import.meta.dirname` em `getSourceFileString()`.
- [x] 2.2 `src/test/classifyExternalUnits.test.js`: trocar `require('../model/classifyExternalUnits')` por `import classifyExternalUnits from '../model/classifyExternalUnits/index.js'`.
- [x] 2.3 `src/test/parsePascalSource.test.js`: trocar os `require(...)` (`fs`, `path`, `{ selectUsesFromSource, getUnitName, USES_CLAUSE_SCOPE }`) por `import` equivalentes a partir de `'../model/parsePascalSource/index.js'`. Também trocado `__dirname` por `import.meta.dirname` nas duas funções auxiliares que leem fixtures.
- [x] 2.4 `src/test/expandDependencyGraph.test.js`: trocar `require('../model/expandDependencyGraph')` e `require('../model/parsePascalSource')` por `import` equivalentes com extensão `.js`. Também adicionado `import { jest } from '@jest/globals'`, já que o Jest não injeta o global `jest` automaticamente em módulos ESM (necessário para `jest.fn(...)`).
- [x] 2.5 `src/test/mountDependenceGraphStructure.test.js`: trocar `require('../model/mountDependenceGraphStructure')` por `import mountDependenceGraphStructure from '../model/mountDependenceGraphStructure/index.js'`.
- [x] 2.6 Verificar que nenhum `require(` restou em `src/test/**` (`grep -rn "require(" src/test` retorna vazio).

## 3. Habilitar ESM nativo no Jest, escopado a `src/`

- [x] 3.1 Criar `src/package.json` com o conteúdo `{ "type": "module" }`.
- [x] 3.2 Atualizar o script `"test"` em `package.json` para `NODE_OPTIONS=--experimental-vm-modules jest`.
- [x] 3.3 Confirmar que o `package.json` da raiz, `jest.config.js` e `forge.config.js` permanecem sem alteração (sem campo `type` na raiz, sem renomeação) — `git diff --stat` confirma que só a linha do script `test` mudou em `package.json`.

## 4. Remover a configuração de interop CJS do Vite

- [x] 4.1 Em `vite.main.config.mjs`, remover o bloco `build.commonjsOptions` (incluindo o comentário associado) e o `import`/estrutura volta a `defineConfig({})`.

## 5. Validar a mudança de ponta a ponta

- [x] 5.1 Rodar `npm test` e confirmar que toda a suíte Jest passa sem alterar nenhuma asserção. (22/22 testes passando)
- [x] 5.2 Rodar `npm start` e confirmar manualmente que Open (.pas), Open Project (.dpr) e a expansão de Root Unit continuam funcionando e renderizando o grafo. (confirmado manualmente pelo usuário; o ambiente de sandbox não tem um binário do Electron compatível com Linux para reexecutar a checagem visual aqui — os targets Vite `main.js`/`preload.js` buildaram sem erro antes de o processo do Electron falhar por mismatch de plataforma)
- [x] 5.3 Rodar `npm run package` e confirmar que o build do processo main conclui sem erros relacionados a `require`/`module.exports`/resolução de módulo. (build concluído com sucesso)
