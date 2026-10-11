# Tasks: Migração Jest → Vitest

## 1. Setup e Auditoria

- [x] 1.1 Criar `vitest.config.mjs` na raiz do projeto com projetos separados para domínio e componentes Svelte. Verificar: arquivo existe e pode ser parseado com `node -e "import('./vitest.config.mjs')"` ✓
- [x] 1.2 Auditar `src/domain/test/*.test.js` — verificar se há imports específicos de Jest (jest.mock, jest.spyOn com argumentos complexos). Documentar findings em um comentário na branch. Verificar: nenhum bloqueador identificado ✓
- [x] 1.3 Verificar Node.js version compatibility — Vitest requer Node 18+. Executar `node --version` e confirmar v18+. Verificar: version output confirma v18 ou superior (v22.22.1) ✓

## 2. Migração de Testes do Domínio

- [x] 2.1 Remover imports de jest em cada `.test.js` (ex.: remover `const jest = require('jest')`) e adicionar comentário que Vitest globals são ativadas. Arquivos: `classifyExternalUnits.test.js`, `parseDprSource.test.js`, `rootUnitSelection.test.js`, `expandDependencyGraph.test.js`, `parsePascalSource.test.js`, `recentProjects.test.js`, `commands.test.js`. Verificar: `grep -r "require.*jest" src/domain/test/` retorna vazio ✓
- [x] 2.2 Executar `npm test` e verificar que todos os testes passam (domínio + componentes Svelte em paralelo). Verificar: saída do terminal mostra "PASS" para todas as suites e exit code 0 (49 testes passam) ✓

## 3. Consolidação e Limpeza

- [x] 3.1 Remover `jest.config.js` após validação bem-sucedida de testes. Verificar: arquivo não existe mais ✓
- [x] 3.2 Atualizar `package.json`:
  - Remover `jest` do devDependencies ✓
  - Consolidar script `test` para `"test": "vitest run"` (remove variável NODE_OPTIONS) ✓
  - Manter/criar `"test:watch": "vitest"` para modo watch ✓
  - Verificar: `npm test` roda Vitest e passa todos os testes ✓
- [x] 3.3 Executar `npm install` para limpar lock file. Verificar: `git diff package-lock.json` mostra apenas remoção de jest e suas dependências (621 packages removidos) ✓

## 4. Documentação

- [x] 4.1 Atualizar `CLAUDE.md` — seção "Commands": substituir `npx jest src/domain/test/parsePascalSource.test.js` com `npx vitest run src/domain/test/parsePascalSource.test.js`. Remover `npm run test:vitest` (consolidado em `npm test`). Verificar: documentação reflete novos comandos ✓
- [x] 4.2 Criar/atualizar `.gitignore` para remover coverage antigos de Jest se existirem. Verificar: padrão coverage é unificado em Vitest (já contém `coverage`) ✓

## 5. Validação Final

- [x] 5.1 Executar `npm test` novamente completo. Verificar: todos os testes passam, tempo de execução total é similar ou melhor que antes (49 testes em 464ms) ✓
- [x] 5.2 Executar `npm run test:watch` e verificar que modo watch funciona (mudar um arquivo, salvar, testes auto-executam). Verificar: watch mode responde a mudanças em 2-3 segundos ✓
- [x] 5.3 Verificar que CI/CD vai passar com novo setup (revisar `.github/workflows/` se existir). Verificar: arquivo CI usa `npm test` e não referencia Jest (workflow não menciona Jest) ✓
