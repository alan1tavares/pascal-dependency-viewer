## ADDED Requirements

### Requirement: Menu `Ferramentas` com "Paleta de Comandos"
O sistema SHALL expor um menu nativo rotulado `Ferramentas`, posicionado
entre `Edição` e o menu de visualização, contendo exatamente uma opção:
`Paleta de Comandos`.

`Paleta de Comandos` SHALL abrir a Command Palette no modo lista de Commands
(capability `command-palette`) e SHALL ter o atalho de teclado `Cmd+P` no
macOS e `Ctrl+P` no Linux, exibido ao lado do rótulo do item. Acionar o
atalho SHALL produzir exatamente o mesmo efeito que clicar no item, a partir
de qualquer tela do app.

#### Scenario: Usuário abre o menu `Ferramentas`
- **WHEN** o usuário abre o menu `Ferramentas`
- **THEN** exatamente uma opção é exibida: `Paleta de Comandos`

#### Scenario: Ordem dos menus
- **WHEN** o app é iniciado
- **THEN** a barra de menus exibe `Arquivo`, `Edição`, `Ferramentas` e, em
  seguida, o menu de visualização

#### Scenario: Atalho exibido no item "Paleta de Comandos"
- **WHEN** o usuário abre o menu `Ferramentas` no macOS ou no Linux
- **THEN** o item exibe o atalho `Cmd+P` (macOS) ou `Ctrl+P` (Linux) ao lado
  do rótulo

#### Scenario: Usuário clica em "Paleta de Comandos"
- **WHEN** o usuário clica em `Paleta de Comandos`
- **THEN** a Command Palette é exibida no modo lista de Commands e nenhum
  diálogo nativo é aberto

#### Scenario: Usuário aciona o atalho da paleta
- **WHEN** o usuário pressiona `Cmd+P` (macOS) ou `Ctrl+P` (Linux) com a
  janela do app em foco
- **THEN** a Command Palette é exibida, exatamente como no clique em
  `Paleta de Comandos`
