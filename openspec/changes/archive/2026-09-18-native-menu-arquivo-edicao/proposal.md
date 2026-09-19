## Why

O menu nativo atual (`src/main/menu.js`) está em inglês (`File` > `Open
Project`) e não tem nenhuma forma de sair do app pelo menu nem nenhum ponto
de entrada para ações futuras de seleção dentro do grafo (unit ou método).
O pedido é traduzir o menu `File` para `Arquivo`, adicionar uma opção
`Sair`, e introduzir um novo menu `Edição` com duas opções — uma delas
(`Selecionar Método`) só precisa mostrar um aviso de "ainda não
implementado", a outra (`Selecionar Unit`) reabre a tela de seleção de
Root Unit já existente (comportamento confirmado pelo usuário real após
uma decisão de design inicialmente em aberto — ver `design.md`).

## What Changes

- O menu `File` é renomeado para `Arquivo`.
- O item `Open Project` é renomeado para `Abrir Projeto`, mantendo
  exatamente o mesmo `click` handler (`performOpenProject`) e o mesmo
  fluxo de IPC/`app:project-loaded` já existentes — **não é uma
  BREAKING change** de comportamento, só de rótulo.
- **Novo item `Sair`** é adicionado ao menu `Arquivo`, abaixo de `Abrir
  Projeto`, encerrando a aplicação (`role: 'quit'`).
- `Arquivo` passa a ter exatamente essas duas opções.
- **Novo menu `Edição`** é adicionado ao menu nativo, com exatamente duas
  opções:
  - `Selecionar Unit`: ao clicar, reabre a tela de busca/listagem de Root
    Unit já existente (`rootUnitSelection.js`), populada com as Project
    Units do último Projeto carregado na sessão, permitindo trocar de
    Root Unit sem reabrir o `.dpr`. Requer um novo evento IPC main→renderer
    (`app:show-root-unit-selection`) e um novo método de preload
    (`onShowRootUnitSelection`) — ver `design.md` para o mecanismo
    completo.
  - `Selecionar Método`: ao clicar, exibe apenas um diálogo/alerta
    informando que a funcionalidade ainda será implementada (ex.:
    `dialog.showMessageBox` com a mensagem "Selecionar Método ainda será
    implementado"). Nenhum outro efeito colateral.
- O item `{ role: "viewMenu" }` existente é **mantido sem alteração** —
  ver "Decisão em aberto" no `design.md` para o raciocínio (o usuário não
  pediu para mexer nele).
- Esta proposta cobre apenas os artefatos de planejamento OpenSpec
  (`proposal`, `specs`, `design`, `tasks`); nenhum código é alterado por
  ela.

## Capabilities

### New Capabilities
- `application-menu`: estrutura do menu nativo da aplicação — os menus
  `Arquivo` (`Abrir Projeto`, `Sair`) e `Edição` (`Selecionar Unit`,
  `Selecionar Método`), incluindo o comportamento de placeholder de
  `Selecionar Método` e o comportamento de `Selecionar Unit` (reabrir a
  tela de seleção de Root Unit já existente).

### Modified Capabilities
- `root-unit-selection`: a Requirement "Abertura de um Projeto (`.dpr`)
  pelo menu" (e seus dois scenarios) descreve hoje o menu como `File` e
  a opção como `"Open Project"`. Como o menu passa a se chamar `Arquivo`
  e a opção passa a se chamar `"Abrir Projeto"`, o texto da requirement e
  dos scenarios é atualizado para os novos rótulos. O comportamento
  (diálogo nativo, parse do `.dpr`, ser a única entrada de `Arquivo` para
  carregar conteúdo Pascal) não muda.

## Impact

- Código: `src/main/menu.js` (rótulos, novo item `Sair`, novo submenu
  `Edição`), `src/preload/api.js` (novo método `onShowRootUnitSelection`),
  `src/renderer/index.js` (guardar o último Projeto carregado e reagir ao
  novo evento) — ver `design.md` para o mecanismo completo.
- Documentação: `CLAUDE.md` (seção "Architecture", que hoje descreve
  `src/main/menu.js` como "File > Open Project" / "viewMenu") precisa de
  ajuste fora deste change (não é um artefato de spec).
- Nenhum impacto em `src/domain/**` — este change é só sobre a camada
  Electron (`main`/`preload`/`renderer`), não sobre parsing.
