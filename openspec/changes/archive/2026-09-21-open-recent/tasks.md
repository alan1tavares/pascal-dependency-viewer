## 1. Lógica pura de Recent Projects (domain)

- [x] 1.1 Criar `src/domain/recentProjects/index.js` com `addRecentProject(list, path, max = 10)` (move/insere no topo, sem duplicatas, corta no limite), `removeRecentProject(list, path)`, `filterRecentProjects(paths, text)` (substring case-insensitive no nome do arquivo e no caminho) e `describeRecentProject(path)` (`{ fileName, dir }`, separadores `/` e `\`); cobrir cada cenário da spec `recent-projects` em `src/domain/test/recentProjects.test.js` e verificar com `npx jest src/domain/test/recentProjects.test.js`

## 2. Persistência (main)

- [x] 2.1 Criar `src/main/services/recentProjects.js` com `list()`, `add(path)` e `remove(path)` sobre `recent-projects.json` em `app.getPath('userData')`, usando as funções da tarefa 1.1; arquivo ausente, JSON inválido ou formato inesperado viram lista vazia e falha de escrita é ignorada; testar em `src/main/test/recentProjects.test.js` (com `electron` mockado e um diretório temporário) os cenários: registrar, persistir entre leituras, ausente/ilegível, e verificar com `npx jest src/main/test/recentProjects.test.js`

## 3. Fluxo de abertura e IPC (main)

- [x] 3.1 Em `src/main/ipc/project.js`, extrair `loadProject(filePath)` (lê, parseia, registra em `recentProjects.add` só depois do parse e devolve `{ projectUnits, projectDir }`) e fazer `performOpenProject` = diálogo + `loadProject`, sem mudar o comportamento de cancelar; verificar em `src/main/test/project.test.js` que abrir registra o recente, que cancelar não registra e que falha de leitura não registra
- [x] 3.2 Registrar os handlers `recentProjects:list` (devolve a lista) e `recentProjects:open` (chama `loadProject`, envia `app:project-loaded` a `event.sender`; se a leitura falhar, `dialog.showMessageBox` de erro e `recentProjects.remove`) em `src/main/ipc/project.js` e ligá-los em `src/main/index.js`; verificar em `src/main/test/project.test.js`: abrir com sucesso envia `app:project-loaded` e move ao topo; arquivo ausente mostra o erro, remove a entrada e não envia `app:project-loaded`

## 4. Menu e atalho em sequência (main)

- [x] 4.1 Criar `src/main/keySequence.js` (máquina de estados: `Cmd/Ctrl+K` arma por 1,5 s e é consumido; `R` armado dispara e é consumido, com ou sem o modificador; outra tecla, exceto só-modificador, ou timeout desarma sem consumir) e testar em `src/main/test/keySequence.test.js` (fake timers) todos os cenários de sequência da spec, incluindo cancelamento por outra tecla, por timeout e `R` sem armar sendo ignorado; verificar com `npx jest src/main/test/keySequence.test.js`
- [x] 4.2 Em `src/main/menu.js`, renomear `Abrir Projeto` para `Abrir projeto (.dpr)` (mantendo `CmdOrCtrl+O`) e adicionar `Abrir recente` logo abaixo, sem `accelerator`, com a dica no rótulo (`Abrir recente  ⌘K R` no macOS, `Abrir recente  Ctrl+K R` nos demais) e `click` que envia `app:show-open-recent`; atualizar `src/main/test/menu.test.js` (ordem `Abrir projeto (.dpr)`, `Abrir recente`, `Sair`, rótulo com a dica, envio do evento) e verificar com `npx jest src/main/test/menu.test.js`
- [x] 4.3 Em `src/main/index.js`, ligar `keySequence` em `mainWindow.webContents.on('before-input-event', ...)` chamando `preventDefault` nas teclas consumidas e enviando `app:show-open-recent` quando a sequência completa; verificar manualmente na tarefa 6.1 (o teste de unidade da 4.1 cobre a lógica)

## 5. Renderer

- [x] 5.1 Expor em `src/preload/api.js` `listRecentProjects()`, `openRecentProject(path)` (ambos `ipcRenderer.invoke`) e `onShowOpenRecent(cb)` (com função de remoção do listener, como os demais); verificar que `src/preload/api.js` segue o padrão dos listeners existentes e que `npm start` sobe sem erro no console
- [x] 5.2 Adicionar em `index.html` o markup e o estilo do overlay `Abrir recente` (topo centralizado, acima do `viewFilterPanel`, fundo que captura clique fora, prefixo fixo `Abrir recente` ao lado do input, lista, mensagem `Nenhum projeto recente`) e criar `src/renderer/components/openRecentDialog.js` com `showOpenRecentDialog()`: busca a lista, foca o input, destaca o primeiro item, filtra ao digitar com `filterRecentProjects`, `↑`/`↓`/`Enter`/`Esc`, clique no item, clique fora, foco no input se já aberto, e fecha ao escolher um item chamando `openRecentProject`; verificar manualmente na tarefa 6.1
- [x] 5.3 Em `src/renderer/index.js`, chamar `showOpenRecentDialog()` em `api.onShowOpenRecent`; verificar manualmente na tarefa 6.1

## 6. Verificação e documentação

- [x] 6.1 (verificado no Electron real sob Xvfb: sequência `Ctrl+K R` e cancelamentos, diálogo vazio/com lista, filtro por nome e pasta, `↑`/`↓`/`Enter`/`Esc`, clique no item e fora, abrir recente até a seleção de Root Unit, arquivo ausente com remoção da entrada; o restante — menu nativo, `Cmd+K R` no macOS, `Abrir projeto (.dpr)` nativo e persistência ao reiniciar — foi testado visualmente pelo usuário) Rodar `npm start` e verificar os cenários das specs `recent-projects` e `application-menu`: menu `Arquivo` com os três itens e a dica de atalho; `Cmd/Ctrl+K R` abre o diálogo (o `r` não é digitado, `Cmd+R` não recarrega) e `Cmd/Ctrl+K X` e o timeout não abrem; diálogo com lista vazia; abrir um `.dpr` por `Abrir projeto (.dpr)` e ver o item na lista; filtro por nome e por pasta; navegação por teclado, `Esc` e clique fora; abrir um recente leva à seleção de Root Unit e `Selecionar Unit` funciona depois; apagar um `.dpr` da lista, escolhê-lo e ver o erro, a remoção da entrada e a tela intacta; reiniciar o app e ver que a lista persistiu
- [x] 6.2 Rodar `npm test` e verificar que a suíte inteira passa
- [x] 6.3 Atualizar `CLAUDE.md` (menu `Arquivo`, novos módulos/IPC/persistência e a exceção "o main não guarda estado de Project", sequência de atalho) e verificar que a descrição bate com o código implementado
