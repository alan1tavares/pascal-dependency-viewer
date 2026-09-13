## 1. Menu e main process

- [x] 1.1 Remover o item `Open` do template de `src/main/menu.js`,
  deixando apenas `Open Project` no menu `File`, e verificar que
  `buildMenu` não referencia mais `performOpenFile`
- [x] 1.2 Remover `src/main/ipc/file.js` e suas referências em
  `src/main/index.js` (`import`, `registerFileHandler(ipcMain)` e a
  passagem de `performOpenFile` para `buildMenu`), e verificar com
  `npm start` que o app sobe sem erro de import quebrado

## 2. Preload e renderer

- [x] 2.1 Remover `openFile` e `onGraphLoaded` de `src/preload/api.js`,
  e verificar que nada mais em `src/preload/` referencia o canal IPC
  `openFile` nem o evento `app:graph-loaded`
- [x] 2.2 Remover a chamada `api.onGraphLoaded(...)` de
  `src/renderer/index.js`, mantendo apenas `api.onProjectLoaded(...)`, e
  verificar visualmente (`npm start`) que abrir um Projeto pelo `Open
  Project` ainda lista as Project Units e renderiza o grafo ao escolher
  uma Root Unit

## 3. Domínio

- [x] 3.1 Remover `src/domain/mountDependenceGraphStructure/` e
  `src/domain/test/mountDependenceGraphStructure.test.js`, e confirmar
  com `grep -rn "mountDependenceGraphStructure" src` que não sobra
  nenhuma referência
- [x] 3.2 Rodar `npm test` e verificar que a suíte passa sem os testes
  removidos e sem quebrar `expandDependencyGraph` ou outros testes de
  domínio

## 4. Specs e documentação

- [x] 4.1 Rodar `openspec validate remove-single-file-open --strict` e
  corrigir qualquer erro apontado antes de seguir para o archive
- [x] 4.2 Atualizar `CONTEXT.md`: remover a menção ao fluxo `File > Open`
  avulso na definição de "Dependency Graph" (linha que contrasta com
  "Dependency Tree"), já que esse fluxo deixa de existir

## 5. Verificação final

- [x] 5.1 Buscar no repositório inteiro (fora de `openspec/` e
  `node_modules/`) por `openFile`, `app:graph-loaded`, `onGraphLoaded` e
  `performOpenFile` e confirmar que nenhuma ocorrência restante é
  código de produção ativo
- [x] 5.2 Abrir o app (`npm start` sob Xvfb) e confirmar
  programaticamente (`Menu.getApplicationMenu()`) que o menu `File`
  mostra só `Open Project`, sem erros de boot ligados à remoção. O
  clique manual no fluxo completo (abrir `.dpr` real, filtrar, escolher
  Root Unit, ver o grafo) fica para o usuário testar localmente — decisão
  registrada em conversa, para não instalar uma dependência de
  automação (`playwright-core`) só para este smoke test
