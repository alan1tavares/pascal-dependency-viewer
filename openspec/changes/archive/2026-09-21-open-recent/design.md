## Context

Ver `proposal.md` para a motivação. Estado atual relevante:

- `Abrir Projeto` (`src/main/menu.js`) chama `performOpenProject` (diálogo
  nativo + `parseDprSource`) e empurra o resultado por `app:project-loaded`.
  `performOpenProject` mistura escolher o arquivo e carregá-lo.
- O main não guarda estado de Project; o renderer guarda o último
  `{ projectUnits, projectDir }` em memória. Nada é persistido entre sessões.
- Aceleradores de menu do Electron aceitam uma única combinação; não existe
  sequência (`Cmd+K` seguido de `R`).
- O renderer não usa framework: telas são `<div>` em `index.html` mostradas ou
  escondidas por módulos em `src/renderer/components/`.
- Testes ficam em `src/domain/test/` (lógica pura) e `src/main/test/` (menu,
  com `electron` mockado via `jest.unstable_mockModule`).

## Goals / Non-Goals

**Goals:**
- Reabrir um Project recente sem o diálogo nativo, por atalho ou menu.
- Manter a lógica de lista (ordem, dedupe, limite, filtro) pura e testável,
  fora do Electron.

**Non-Goals:**
- Paleta de comandos geral. O diálogo é só o modo `Abrir recente`, mas o
  componente é isolado para virar um modo de uma paleta futura (com
  `Selecionar Unit`, por exemplo).
- Remover/limpar recentes manualmente, fixar (pin) itens, ou menu
  `Abrir recente` com submenu de projetos.
- Suporte a Windows no rótulo/atalho (o pedido cita macOS e Linux; `CmdOrCtrl`
  já cobriria, mas não é validado).

## Decisions

**1. Sequência `Cmd/Ctrl+K R` tratada no main com `before-input-event`.**
Uma pequena máquina de estados pura em `src/main/keySequence.js` (recebe
eventos de tecla, devolve `{ handled, action }`) e ligada em
`mainWindow.webContents.on('before-input-event', ...)` em `src/main/index.js`.
- `keyDown` de `k` com `meta` (macOS) ou `control` (demais) arma a sequência
  (1,5 s) e é consumida (`preventDefault`).
- Armado: `keyDown` de `r`, com ou sem o modificador ainda pressionado, dispara
  a ação e é consumido. Consumir também evita que `Cmd+R` (Reload do
  `viewMenu`) seja acionado se o usuário mantiver o `Cmd` apertado.
- Armado: qualquer outra tecla que não seja só modificador (`Shift`, `Meta`,
  `Control`, `Alt`) desarma e NÃO é consumida; timeout também desarma.
- Alternativas: `keydown` no renderer (falha se o foco estiver em DevTools e
  espalha lógica de atalho no renderer); `globalShortcut` (é global do SO, não
  serve para atalho de janela); aceleradores nativos (não suportam sequência).
- Como o menu não mostra o atalho, a dica vai no rótulo:
  `Abrir recente  ⌘K R` (macOS, `process.platform === 'darwin'`) ou
  `Abrir recente  Ctrl+K R`.

**2. Um único canal main → renderer para abrir o diálogo:
`app:show-open-recent` (sem payload).** Menu e sequência enviam o mesmo
evento, como `app:show-root-unit-selection`. O main continua sem estado de
Project; ao receber o evento o renderer pede a lista por IPC.

**3. Persistência em `recent-projects.json` no `userData`, escrita pelo main.**
`src/main/services/recentProjects.js` expõe `list()`, `add(path)` e
`remove(path)`, resolvendo o arquivo com `app.getPath('userData')` a cada
chamada e usando `fs` síncrono (mesmo estilo de `services/fileSystem.js`). A
regra de lista (mover ao topo, dedupe, limite 10) fica em uma função pura
`addRecentProject(list, path, max)` em `src/domain/recentProjects/`, testável
sem Electron. Arquivo ausente, JSON inválido ou formato inesperado viram lista
vazia; falha ao escrever é engolida, para que abrir um Project nunca falhe por
causa dos recentes.
- Alternativas: `localStorage` do renderer (preso ao origin, difícil de testar
  e de compartilhar com o main); `electron-store` (nova dependência para um
  array de strings).

**4. Separar "escolher arquivo" de "carregar Project" em `src/main/ipc/project.js`.**
`loadProject(filePath)` lê, parseia e registra como recente
(`recentProjects.add`) e devolve `{ projectUnits, projectDir }`;
`performOpenProject` passa a ser diálogo + `loadProject`. Registrar só depois
do parse garante "aberto com sucesso". Isso também cobre o handler
`openProject` já existente, que reusa `performOpenProject`.

**5. Canais IPC novos (`recentProjects:list`, `recentProjects:open`).**
- `recentProjects:list` (`invoke`) devolve a lista de caminhos.
- `recentProjects:open` (`invoke`, recebe o caminho) chama `loadProject`; em
  sucesso envia `app:project-loaded` ao renderer que chamou (`event.sender`),
  exatamente como o menu faz, mantendo um único caminho de "Project carregado".
  Se `readFile` falhar, mostra `dialog.showMessageBox` de erro e chama
  `recentProjects.remove(path)`.
- O preload expõe `listRecentProjects()`, `openRecentProject(path)` e
  `onShowOpenRecent(cb)`, seguindo o formato de `api.js`.

**6. Diálogo no renderer: `src/renderer/components/openRecentDialog.js` +
markup/estilo do overlay em `index.html`.**
- `showOpenRecentDialog()` busca a lista, mostra o overlay (`position:
  fixed`, topo centralizado, acima do `viewFilterPanel`, fundo escurecido que
  captura o clique de fechar), foca o input e destaca o primeiro item. Se já
  estiver aberto, só foca o input.
- O prefixo `Abrir recente` é um `<span>` fixo ao lado do `<input>`, não faz
  parte do valor do input.
- `↑`/`↓`/`Enter`/`Esc` tratados no `keydown` do input; clique no item abre;
  clique no fundo fecha.
- Escolher um item fecha o diálogo e chama `openRecentProject`, mesmo se o
  arquivo estiver ausente (o aviso vem do main); não reabre o diálogo depois.
- Filtro e divisão do caminho em nome do arquivo/pasta são funções puras em
  `src/domain/recentProjects/` (`filterRecentProjects`,
  `describeRecentProject`), tratando `/` e `\` como separadores.

## Risks / Trade-offs

- [Consumir `Cmd/Ctrl+K` sempre, mesmo em campos de texto] → só afeta a
  janela do app; nenhum outro atalho do app usa essa tecla. O `Ctrl+K` do
  Linux não tem função padrão nos inputs do renderer.
- [A dica do atalho no rótulo pode dessincronizar do código da sequência] →
  ambos vivem no main e o teste de menu confere o rótulo.
- [Lista persistida referencia arquivos apagados] → tratado só ao escolher o
  item (decisão do usuário: sem I/O ao abrir o diálogo).
- [Layout de teclado não-QWERTY] → a sequência usa `input.key` (caractere
  produzido), então segue o layout ativo.
- [Estado da sequência no main é o único estado novo do main] → é só um flag
  de UI com timer, não estado de Project.

## Migration Plan

Nenhuma migração: o arquivo de recentes é criado no primeiro Project aberto.
Rollback é reverter a mudança; o JSON remanescente é ignorado.
