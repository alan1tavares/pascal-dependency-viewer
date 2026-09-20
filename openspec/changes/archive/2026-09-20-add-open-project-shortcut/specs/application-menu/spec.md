## MODIFIED Requirements

### Requirement: Menu `Arquivo` com "Abrir Projeto" e "Sair"
O sistema SHALL expor um menu nativo rotulado `Arquivo` contendo exatamente
duas opções, nesta ordem: `Abrir Projeto` e `Sair`.

`Abrir Projeto` SHALL disparar exatamente o mesmo fluxo hoje disparado pela
opção `Open Project` (capability `root-unit-selection`): abrir o diálogo
nativo de seleção de arquivo `.dpr`, parsear o arquivo escolhido com
`parseDprSource`, e — se um arquivo foi escolhido — notificar o renderer via
o evento `app:project-loaded` com `{ projectUnits, projectDir }`.

`Abrir Projeto` SHALL ter o atalho de teclado `Cmd+O` no macOS e `Ctrl+O` no
Linux, e o atalho SHALL ser exibido ao lado do rótulo do item no menu
`Arquivo`. Acionar o atalho SHALL produzir exatamente o mesmo efeito que
clicar no item, a partir de qualquer tela do app.

`Sair` SHALL encerrar a aplicação.

#### Scenario: Usuário abre o menu `Arquivo`
- **WHEN** o usuário abre o menu `Arquivo`
- **THEN** exatamente duas opções são exibidas, nesta ordem: `Abrir
  Projeto` e `Sair`

#### Scenario: Atalho exibido no item "Abrir Projeto"
- **WHEN** o usuário abre o menu `Arquivo` no macOS ou no Linux
- **THEN** o item `Abrir Projeto` exibe o atalho `Cmd+O` (macOS) ou
  `Ctrl+O` (Linux) ao lado do rótulo

#### Scenario: Usuário clica em "Abrir Projeto"
- **WHEN** o usuário clica em `Abrir Projeto` e escolhe um arquivo `.dpr`
  no diálogo nativo
- **THEN** o app lê e parseia o arquivo com `parseDprSource` e envia
  `{ projectUnits, projectDir }` ao renderer via `app:project-loaded`,
  exatamente como a opção `Open Project` fazia antes desta mudança

#### Scenario: Usuário aciona o atalho de abrir projeto
- **WHEN** o usuário pressiona `Cmd+O` (macOS) ou `Ctrl+O` (Linux) com a
  janela do app em foco e escolhe um arquivo `.dpr` no diálogo nativo
- **THEN** o app se comporta exatamente como no clique em `Abrir Projeto`:
  lê e parseia o arquivo com `parseDprSource` e envia
  `{ projectUnits, projectDir }` ao renderer via `app:project-loaded`

#### Scenario: Usuário aciona o atalho e cancela o diálogo
- **WHEN** o usuário pressiona o atalho de abrir projeto e fecha o diálogo
  nativo sem escolher um arquivo
- **THEN** nenhum evento `app:project-loaded` é enviado e o estado atual do
  renderer não muda

#### Scenario: Usuário clica em "Abrir Projeto" e cancela o diálogo
- **WHEN** o usuário clica em `Abrir Projeto` e fecha o diálogo nativo sem
  escolher um arquivo
- **THEN** nenhum evento `app:project-loaded` é enviado e o estado atual do
  renderer não muda

#### Scenario: Usuário clica em "Sair"
- **WHEN** o usuário clica em `Sair`
- **THEN** a aplicação é encerrada, sem exigir nenhuma confirmação
  adicional
