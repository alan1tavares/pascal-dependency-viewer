## Why

Reabrir um projeto usado com frequência exige navegar pelo diálogo nativo de
arquivos toda vez. Um acesso rápido, por teclado, aos Projetos abertos
recentemente (no estilo da paleta do VS Code) elimina essa fricção.

## What Changes

- Renomear o item `Abrir Projeto` do menu `Arquivo` para `Abrir projeto
  (.dpr)`, mantendo o atalho `CmdOrCtrl+O` e o fluxo atual.
- Adicionar o item `Abrir recente` ao menu `Arquivo`, logo abaixo de `Abrir
  projeto (.dpr)`, com atalho em sequência `Cmd+K R` (macOS) / `Ctrl+K R`
  (Linux). Aceleradores nativos do Electron não suportam sequência: o atalho é
  tratado no processo main e o item de menu não tem acelerador nativo (a
  dica `⌘K R` vai no rótulo).
- Novo diálogo "Abrir recente": overlay dentro da página do renderer, no
  topo centralizado, com um input que exibe `Abrir recente` como prefixo fixo
  e, abaixo, a lista de Recent Projects filtrável pelo texto digitado.
  Navegação por `↑`/`↓`, `Enter`, `Esc`, clique no item e clique fora.
- Persistir os Recent Projects (caminho do `.dpr`, mais recente primeiro, sem
  duplicatas, limite de 10) em arquivo JSON no `userData` do Electron.
  Todo Project aberto com sucesso — por `Abrir projeto (.dpr)` ou por `Abrir
  recente` — é registrado.
- Escolher um Recent Project reaproveita o fluxo de abertura de Project
  (parse do `.dpr`, tela de seleção de Root Unit). Se o arquivo não existir
  mais, exibir um aviso de erro e remover a entrada da lista.
- Fora de escopo: paleta de comandos geral. O diálogo tem apenas o modo
  `Abrir recente`; a evolução para uma paleta com outros comandos (como
  `Selecionar Unit`) fica para uma mudança futura.

## Capabilities

### New Capabilities

- `recent-projects`: registro persistente dos Recent Projects e o diálogo
  `Abrir recente` (abertura por atalho/menu, filtro, navegação por teclado,
  tratamento de arquivo ausente).

### Modified Capabilities

- `application-menu`: o menu `Arquivo` passa a ter três itens (`Abrir projeto
  (.dpr)`, `Abrir recente`, `Sair`); rótulo do primeiro item muda; o novo
  item e o atalho em sequência `Cmd/Ctrl+K R`.
- `root-unit-selection`: o item de abrir Project deixa de ser a única entrada
  do menu `Arquivo` para carregar conteúdo Pascal (agora também há `Abrir
  recente`), e o rótulo passa a `Abrir projeto (.dpr)`.

## Impact

- Código: `src/main/menu.js`, `src/main/index.js` (tratamento da sequência
  via `before-input-event`), `src/main/ipc/project.js` (registrar recente
  após abrir; novos handlers de recentes), novo
  `src/main/services/recentProjects.js`, `src/preload/api.js`,
  `src/renderer/index.js`, novo componente
  `src/renderer/components/openRecentDialog.js`, `index.html` (markup/estilo
  do overlay) e testes correspondentes (`src/main/test/`).
- Novo evento main → renderer para abrir o diálogo, e novos canais IPC
  (listar/abrir Recent Project).
- Sem novas dependências. `CONTEXT.md` já contém o termo Recent Project.
