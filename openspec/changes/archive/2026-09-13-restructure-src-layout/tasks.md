## 1. Mover a camada de domínio (`model/` → `domain/`)

- [x] 1.1 `git mv src/model src/domain` e verificar com `ls src/domain` que as 4 subpastas de módulo estão lá.
- [x] 1.2 `git mv src/test src/domain/test` e verificar com `ls src/domain/test` que os 5 arquivos de teste e os 3 fixtures (`.pas`/`.dpr`) estão lá.
- [x] 1.3 Nos 5 arquivos de `src/domain/test/*.test.js`, trocar os imports de `../model/<Módulo>/index.js` (ou `../model/parsePascalSource`) por `../<Módulo>/index.js` (um nível mais raso, já que `test/` passa a ser irmã de cada pasta de módulo dentro de `domain/`) e verificar rodando `npm test` (22/22 devem passar; `src/main.js` segue importando do caminho antigo neste ponto e só será corrigido na seção 2 — isso é esperado e não é coberto por `npm test`).
- [x] 1.4 Verificar com `grep -rn "src/model\|src/test" --include="*.js" .` (fora de `node_modules`/`openspec/changes/archive`) que nenhum arquivo de código vivo ainda referencia os caminhos antigos, exceto `src/main.js` (que a seção 2 corrige).

## 2. Reestruturar `main.js` em `main/`

- [x] 2.1 Criar `src/main/services/fileSystem.js` exportando `readFile(filePath)`, um wrapper fino sobre `fs.readFileSync(filePath, 'utf-8')`.
- [x] 2.2 Criar `src/main/ipc/file.js` exportando `performOpenFile` e `registerFileHandler(ipcMain)` (`ipcMain.handle('openFile', () => performOpenFile())`), usando `getUnitName`/`selectUsesFromSource` de `../../domain/parsePascalSource/index.js`, `mountDependenceGraphStructure` de `../../domain/mountDependenceGraphStructure/index.js` e `readFile` de `../services/fileSystem.js`.
- [x] 2.3 Criar `src/main/ipc/project.js` exportando `performOpenProject` e `registerProjectHandler(ipcMain)`, usando `parseDprSource` de `../../domain/parseDprSource/index.js` e `readFile` de `../services/fileSystem.js`.
- [x] 2.4 Criar `src/main/ipc/graph.js` exportando `registerGraphHandler(ipcMain)` (`ipcMain.handle('expandFromRootUnit', (_event, args) => performExpandFromRootUnit(args))`), usando `getUnitName` de `../../domain/parsePascalSource/index.js`, `expandDependencyGraph` de `../../domain/expandDependencyGraph/index.js` e `readFile` de `../services/fileSystem.js`.
- [x] 2.5 Criar `src/main/menu.js` exportando `buildMenu(mainWindow, { performOpenFile, performOpenProject })`, com o mesmo template de menu de hoje (`File > Open`, `File > Open Project`, `viewMenu`), recebendo `mainWindow` e as duas funções como parâmetros em vez de fechar sobre uma variável de módulo.
- [x] 2.6 Criar `src/main/index.js`: cria a `BrowserWindow`, chama `buildMenu(mainWindow, { performOpenFile, performOpenProject })` (importando `performOpenFile`/`performOpenProject` de `./ipc/file.js`/`./ipc/project.js`) e os três `registerXHandler(ipcMain)`, mantendo `app.whenReady()`, `createWindow()`, o handler de `window-all-closed` e o check de `electron-squirrel-startup`. Apagar `src/main.js`.
- [x] 2.7 Verificar com `grep -rn "\.\./model\|\./model" src/main` (deve retornar vazio) e conferir manualmente que cada `import` em `src/main/**` resolve para um arquivo existente.

## 3. Reestruturar `preload.js` em `preload/`

- [x] 3.1 Criar `src/preload/api.js` exportando o mesmo objeto hoje passado para `contextBridge.exposeInMainWorld` (`openFile`, `openProject`, `expandFromRootUnit`, `onGraphLoaded`, `onProjectLoaded`).
- [x] 3.2 Criar `src/preload/index.js` importando `contextBridge` e o objeto de `./api.js`, chamando `contextBridge.exposeInMainWorld('pascalDependencyViewer', api)`. Apagar `src/preload.js`.

## 4. Reestruturar `renderer.js` em `renderer/`

- [x] 4.1 Criar `src/renderer/components/graphView.js` exportando `renderGraph(nodesData, edgesData)` (mesma lógica de hoje, incluindo os `DataSet`/`Network` do `vis-data`/`vis-network`).
- [x] 4.2 Criar `src/renderer/components/rootUnitSelection.js` exportando `renderRootUnitSelection(projectUnits, projectDir)`, mantendo `renderRootUnitList`/`selectRootUnit` como funções internas do módulo e importando `renderGraph` de `./graphView.js` (chamado depois de `api.expandFromRootUnit`).
- [x] 4.3 Criar `src/renderer/index.js`: pega `window.pascalDependencyViewer`, importa os dois componentes acima e liga `api.onGraphLoaded(...)`/`api.onProjectLoaded(...)`. Apagar `src/renderer.js`.
- [x] 4.4 Atualizar `index.html`: `<script type="module" src="/src/renderer.js">` → `/src/renderer/index.js`.

## 5. Atualizar configuração de build

- [x] 5.1 Em `forge.config.js`, atualizar os dois `entry`: `'src/main.js'` → `'src/main/index.js'`, `'src/preload.js'` → `'src/preload/index.js'`.
- [x] 5.2 Em `vite.main.config.mjs`, adicionar `build.lib.fileName: () => 'main.js'` (mantendo o resto do `defineConfig`). Descoberto durante a implementação: o template de config do plugin só preenche `entry`/`formats` quando `build.lib` está ausente, então precisou fornecer o `lib` completo (`entry: 'src/main/index.js'`, `fileName`, `formats: ['cjs']`), não só `fileName` — ver design.md, Decisão 5.
- [x] 5.3 Em `vite.preload.config.mjs`, adicionar `build.rollupOptions.output.entryFileNames: 'preload.js'` (mantendo o resto do `defineConfig`).

## 6. Atualizar documentação

- [x] 6.1 Reescrever a seção Arquitetura de `CLAUDE.md` para descrever `main/`, `preload/`, `renderer/`, `domain/` (caminhos, responsabilidades de cada arquivo, fluxo de dados), e corrigir as duas frases da seção Notes já desatualizadas por uma migração anterior (menção a `src/model/**` ser CommonJS e a `vite.main.config.mjs` precisar de `commonjsOptions.include` — ambas falsas desde a migração para ESM).

## 7. Validar a mudança de ponta a ponta

- [x] 7.1 Rodar `npm test` e confirmar que toda a suíte Jest passa (22/22) sem alterar nenhuma asserção.
- [x] 7.2 Rodar `npm run package` e confirmar que `.vite/build/main.js` e `.vite/build/preload.js` existem como dois arquivos distintos (não um sobrescrevendo o outro) e que o build conclui sem erro de resolução de módulo.
- [x] 7.3 Rodar `npm start` e confirmar manualmente que File > Open (.pas), File > Open Project (.dpr), a seleção/filtro de Root Unit e a expansão do grafo continuam funcionando exatamente como antes. (Neste sandbox: `src/main/index.js` e `src/preload/index.js` buildam sem erro e o Electron chega a inicializar — falha só por falta de servidor X/`$DISPLAY` no ambiente headless, não relacionado ao código. Verificação visual completa pendente na sua máquina.)
