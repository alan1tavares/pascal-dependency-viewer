## 1. Menu `Arquivo`

- [x] 1.1 Renomear o menu `File` para `Arquivo` e o item `Open Project`
      para `Abrir Projeto` em `src/main/menu.js`, mantendo o `click`
      handler existente (`performOpenProject` + `app:project-loaded`)
      inalterado — verificar rodando `npm start` e confirmando que o
      fluxo de abrir um `.dpr` continua funcionando de ponta a ponta.
      Implementado; verificado via os novos testes automatizados de
      `src/main/test/menu.test.js` (não foi possível rodar `npm start`
      num sandbox headless sem UI do Electron).
- [x] 1.2 Adicionar o item `Sair` ao menu `Arquivo`, abaixo de `Abrir
      Projeto`, usando `role: "quit"` com `label: "Sair"` — verificar
      manualmente que clicar em `Sair` encerra a aplicação.
      Implementado (`role: "quit"` delega o encerramento ao Electron);
      verificação manual de clique não realizável neste sandbox headless.
- [x] 1.3 Atualizar/adicionar testes que cubram o template do menu
      `Arquivo` (rótulos e ordem dos dois itens) se o projeto já tiver
      testes para `buildMenu`; caso não existam, avaliar se vale a pena
      introduzi-los nesta mudança (a suíte atual é focada em
      `src/domain/**` — ver `CLAUDE.md`).
      Não existiam testes para `buildMenu`; decidido introduzi-los —
      `src/main/test/menu.test.js` mocka `electron` (`jest.unstable_mockModule`)
      e cobre rótulos/ordem de `Arquivo` e `Edição`, `role: "quit"` de
      `Sair`, `{ role: "viewMenu" }`, e o comportamento de clique dos
      quatro itens.

## 2. Menu `Edição`

- [x] 2.1 Criar o novo menu `Edição` em `src/main/menu.js`, com dois
      itens nesta ordem: `Selecionar Unit` e `Selecionar Método` —
      verificar abrindo o app e conferindo visualmente rótulos e ordem.
      Implementado; ordem e rótulos cobertos por
      `src/main/test/menu.test.js` (verificação visual manual não
      realizável neste sandbox headless).
- [x] 2.2 Implementar o `click` de `Selecionar Método` disparando
      `dialog.showMessageBox(mainWindow, { message: "Selecionar Método
      ainda será implementado" })` (ou equivalente), sem nenhum outro
      efeito colateral — verificar que clicar exibe o diálogo e que
      fechá-lo não altera nenhum estado do app.
      Implementado exatamente assim; teste automatizado confirma a
      chamada a `dialog.showMessageBox` e a ausência de qualquer
      `webContents.send`.
- [x] 2.3 Adicionar o canal `app:show-root-unit-selection` ao `preload/api.js`:
      um novo método `onShowRootUnitSelection(callback)`, espelhando
      `onProjectLoaded` (`ipcRenderer.on` + função de cleanup) — verificar
      lendo o arquivo e conferindo que segue exatamente o mesmo padrão de
      `onProjectLoaded`.
      Implementado, seguindo exatamente o mesmo padrão de `onProjectLoaded`
      (listener + função de cleanup via `removeListener`).
- [x] 2.4 Implementar o `click` de `Selecionar Unit` em `src/main/menu.js`
      disparando `mainWindow.webContents.send('app:show-root-unit-selection')`,
      sem nenhum payload — verificar que o evento chega ao renderer (ex.
      via um listener temporário de log durante o desenvolvimento).
      Implementado; teste automatizado confirma o `send` sem payload.
- [x] 2.5 Em `src/renderer/index.js`, guardar o último `{ projectUnits,
      projectDir }` recebido por `onProjectLoaded` numa variável de
      módulo, e registrar `onShowRootUnitSelection` chamando
      `renderRootUnitSelection(projectUnits, projectDir)` de novo com
      esses valores quando eles já tiverem sido definidos — verificar
      manualmente: abrir um Projeto, escolher uma Root Unit para ver o
      grafo, depois clicar em `Edição > Selecionar Unit` e confirmar que
      a tela de Root Unit reabre com a mesma listagem de Project Units.
      Implementado (variável de módulo `lastProject` guardada em
      `onProjectLoaded`, reaproveitada em `onShowRootUnitSelection`);
      verificação manual de ponta a ponta não realizável neste sandbox
      headless (sem UI do Electron).
- [x] 2.6 Verificar o caminho de no-op: iniciar o app sem abrir nenhum
      Projeto e clicar em `Edição > Selecionar Unit` — confirmar que
      nada muda na tela (nem a tela de Root Unit é exibida, nem qualquer
      diálogo aparece).
      Verificado manualmente pelo usuário real (fora deste sandbox
      headless): iniciar o app sem Projeto carregado e clicar em
      `Edição > Selecionar Unit` não tem nenhum efeito visível, conforme
      o spec.
- [x] 2.7 Verificar a troca de Root Unit propriamente dita: a partir da
      tela reaberta pela task 2.5, escolher uma Project Unit diferente
      da que estava sendo exibida e confirmar que o grafo é substituído
      pelo grafo expandido a partir da nova Root Unit escolhida.
      Verificado manualmente pelo usuário real (fora deste sandbox
      headless): a partir da tela reaberta por `Selecionar Unit`,
      escolher uma Project Unit diferente troca corretamente o grafo
      exibido para o expandido a partir da nova Root Unit.

## 3. Documentação

- [x] 3.1 Atualizar a seção "Architecture" de `CLAUDE.md` que hoje
      descreve `src/main/menu.js` como `File > Open Project` / `viewMenu`
      para refletir `Arquivo` (`Abrir Projeto`, `Sair`) e `Edição`
      (`Selecionar Unit`, `Selecionar Método`) — verificar por leitura
      que o texto bate com o `template` final de `buildMenu`.
      Atualizado (seções "Architecture", data flow e "Process
      boundaries" de `CLAUDE.md`); texto revisado contra o `template`
      final de `buildMenu` em `src/main/menu.js`.
