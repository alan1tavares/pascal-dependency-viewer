## Why

O app já tem ações espalhadas por menus e atalhos diferentes (`Abrir projeto
(.dpr)`, `Abrir recente`, `Selecionar Unit`), e o diálogo `Abrir recente` foi
construído, desde o início, como o primeiro modo de uma paleta de comandos
futura. Uma paleta única, acionada por `Cmd/Ctrl+P`, dá acesso rápido por
teclado a qualquer ação pelo nome e ajuda a descobrir os atalhos.

## What Changes

- Nova **Command Palette**: overlay no topo da tela, com input de busca e
  lista de Commands filtrável, acionada por `Cmd+P` (macOS) / `Ctrl+P`
  (Linux) e pelo novo item de menu.
- Novo menu nativo `Ferramentas`, entre `Edição` e o menu de visualização,
  com um único item `Paleta de Comandos` (`CmdOrCtrl+P`). Acionar o atalho
  produz o mesmo efeito que clicar no item.
- Catálogo inicial de Commands: `Abrir projeto (.dpr)`, `Abrir recente` e
  `Selecionar Unit`. `Selecionar Método` (só um alerta) e `Sair` ficam de
  fora. `Selecionar Unit` só é oferecido quando há um Project aberto na
  sessão.
- Cada linha da lista mostra o rótulo e, à direita, a dica de atalho quando
  existir (`⌘O` / `Ctrl+O`, `⌘K R` / `Ctrl+K R`).
- O filtro da lista de Commands é por substring, sem diferenciar maiúsculas
  nem acentos, na ordem fixa do catálogo; sem resultado exibe `Nenhum comando
  encontrado`.
- A paleta passa a ter dois modos na mesma janela: a lista de Commands e a
  lista de Recent Projects (o antigo diálogo `Abrir recente`, com o prefixo
  fixo `Abrir recente`). Escolher o Command `Abrir recente` troca para o modo
  recentes; `Esc` no modo recentes volta à lista de Commands, e `Esc` na
  lista de Commands fecha a paleta. `Cmd/Ctrl+K R` e `Arquivo > Abrir
  recente` continuam abrindo direto no modo recentes e, nesse caso, `Esc`
  fecha tudo.
- Escolher qualquer Command, exceto `Abrir recente`, fecha a paleta e depois
  o executa. Cancelar o diálogo nativo de `Abrir projeto (.dpr)` não reabre
  a paleta.
- O catálogo de Commands passa a ser único (`domain/`), consumido pela paleta
  e pelo menu; a execução dos Commands fica no processo main e é acionada
  pela paleta por um novo canal IPC.
- Fora de escopo: histórico/ordenação por uso, `Selecionar Método`, `Sair`
  na paleta, e qualquer Command novo além dos três iniciais.

## Capabilities

### New Capabilities

- `command-palette`: o overlay Command Palette (abertura por menu/atalho,
  modo lista de Commands, filtro, navegação por teclado, dicas de atalho,
  disponibilidade de `Selecionar Unit`, execução e fechamento, e a troca para
  o modo `Abrir recente`).

### Modified Capabilities

- `application-menu`: novo menu `Ferramentas` com o item `Paleta de
  Comandos` e o atalho `CmdOrCtrl+P`; ordem dos menus de topo passa a incluir
  `Ferramentas` entre `Edição` e o menu de visualização.
- `recent-projects`: o diálogo `Abrir recente` deixa de ser uma janela
  própria e passa a ser o modo `Abrir recente` da Command Palette (mesma
  aparência e regras de filtro e navegação, com `Esc` voltando à lista de
  Commands quando a paleta foi aberta por ela).

## Impact

- Código: `src/main/menu.js` (menu `Ferramentas`; itens passam a usar o
  catálogo), `src/main/index.js` (registro do novo handler), novo
  `src/main/commands.js` (execução dos Commands por `id`) e handler IPC de
  execução, `src/preload/api.js` (`runCommand`, `onShowCommandPalette`),
  `src/renderer/index.js`, novo `src/renderer/components/commandPalette.js`
  (absorve `openRecentDialog.js`), `index.html` (markup/estilo do overlay) e
  novo `src/domain/commands/` (catálogo e filtro), com testes em
  `src/domain/test/` e `src/main/test/`.
- Novo evento main → renderer `app:show-command-palette` e novo canal IPC
  `commands:run`. O evento `app:show-open-recent` é mantido.
- Sem novas dependências. `CONTEXT.md` já contém os termos Command e Command
  Palette. `CLAUDE.md` precisa ser atualizado ao final.
