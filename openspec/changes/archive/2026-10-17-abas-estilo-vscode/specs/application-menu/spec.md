# Spec Delta

## ADDED Requirements

### Requirement: Menu `Ajuda` com "Bem-vindo"
O sistema SHALL expor um menu nativo rotulado `Ajuda`, posicionado depois do
menu de visualização, contendo exatamente uma opção: `Bem-vindo`, sem atalho
de teclado. `Bem-vindo` SHALL ativar a Welcome Tab, abrindo-a antes no fim
da barra se ela tiver sido fechada (capability `tabs`). O efeito SHALL ser o
mesmo do Command `Bem-vindo` da Command Palette.

#### Scenario: Usuário abre o menu `Ajuda`
- **WHEN** o usuário abre o menu `Ajuda`
- **THEN** exatamente uma opção é exibida: `Bem-vindo`

#### Scenario: Usuário clica em "Bem-vindo" com a Welcome Tab fechada
- **WHEN** a Welcome Tab foi fechada, a Graph Tab `UnitA` está ativa e o
  usuário clica em `Ajuda > Bem-vindo`
- **THEN** a Welcome Tab é aberta no fim da barra e fica ativa

#### Scenario: Usuário clica em "Bem-vindo" com a Welcome Tab aberta
- **WHEN** as Tabs `Bem-vindo` e `UnitA` estão abertas, `UnitA` está ativa, e
  o usuário clica em `Ajuda > Bem-vindo`
- **THEN** `Bem-vindo` passa a ser a Tab ativa e nenhuma nova Tab é aberta

## MODIFIED Requirements

### Requirement: "Selecionar Unit" reabre a tela de seleção de Root Unit
Ao clicar em `Selecionar Unit`, o sistema SHALL reabrir a tela de
busca/listagem de Root Unit já existente (capability
`root-unit-selection`), populada com as mesmas Project Units e o mesmo
`projectDir` do último Projeto carregado nesta sessão (seja pela opção
`Abrir projeto (.dpr)`, seja pela opção `Abrir recente`, seja por qualquer
expansão de grafo já feita a partir dele) — sem reabrir o diálogo nativo de
seleção de arquivo `.dpr` e sem reler o `.dpr` do disco. O usuário pode então
escolher uma Project Unit como Root Unit, o que abre (ou ativa, se já
existir) a Graph Tab dela, como coberto pelas capabilities
`root-unit-selection` e `tabs`, sem fechar as Graph Tabs já abertas.

Se nenhum Projeto tiver sido carregado ainda nesta sessão (nenhum
`app:project-loaded` recebido), clicar em `Selecionar Unit` SHALL não ter
nenhum efeito visível — nem abrir a tela de Root Unit (que não teria
Project Units para listar), nem exibir qualquer diálogo.

#### Scenario: Usuário reabre a tela de Root Unit a partir do grafo já renderizado
- **WHEN** o usuário já abriu um Projeto (`UnitA`, `UnitB`, `UnitC` como
  Project Units), já escolheu `UnitA` como Root Unit e está com a Graph
  Tab `UnitA` ativa, e então clica em `Selecionar Unit` no menu `Edição`
- **THEN** a tela de busca/listagem de Root Unit é exibida novamente, com
  as mesmas três Project Units do Projeto aberto, sem precisar reabrir o
  `.dpr` pelo menu `Arquivo`

#### Scenario: Usuário escolhe uma nova Root Unit após reabrir a tela
- **WHEN**, a partir da tela reaberta por `Selecionar Unit`, o usuário
  clica em `UnitB`
- **THEN** o grafo é expandido a partir de `UnitB` exatamente como
  aconteceria ao escolher `UnitB` na tela original de Root Unit
  (capability `root-unit-selection`), numa nova Graph Tab `UnitB` que fica
  ativa, e a Graph Tab `UnitA` continua aberta

#### Scenario: Usuário reabre a tela de Root Unit sem nenhuma Graph Tab
- **WHEN** o usuário abriu um Projeto, fechou o modo `Selecionar Unit`
  exibido automaticamente sem escolher nada, e clica em `Selecionar Unit`
  no menu `Edição`
- **THEN** a tela de busca/listagem de Root Unit é exibida com as Project
  Units desse Projeto

#### Scenario: "Selecionar Unit" clicado sem nenhum Projeto carregado
- **WHEN** o usuário clica em `Selecionar Unit` antes de ter aberto
  qualquer Projeto nesta sessão (via `Abrir projeto (.dpr)` ou `Abrir
  recente`)
- **THEN** nada acontece — nenhuma tela é exibida ou trocada, e nenhum
  diálogo aparece

#### Scenario: "Selecionar Unit" após abrir um Projeto por "Abrir recente"
- **WHEN** o usuário abre um Projeto por `Abrir recente` e então clica em
  `Selecionar Unit`
- **THEN** a tela de busca/listagem de Root Unit é exibida com as Project
  Units desse Projeto

### Requirement: Menu `Ferramentas` com "Paleta de Comandos"
O sistema SHALL expor um menu nativo rotulado `Ferramentas`, posicionado
entre `Edição` e o menu de visualização, contendo exatamente uma opção:
`Paleta de Comandos`.

`Paleta de Comandos` SHALL abrir a Command Palette no modo lista de Commands
(capability `command-palette`) e SHALL ter o atalho de teclado `Cmd+P` no
macOS e `Ctrl+P` no Linux, exibido ao lado do rótulo do item. Acionar o
atalho SHALL produzir exatamente o mesmo efeito que clicar no item, a partir
de qualquer Tab do app.

#### Scenario: Usuário abre o menu `Ferramentas`
- **WHEN** o usuário abre o menu `Ferramentas`
- **THEN** exatamente uma opção é exibida: `Paleta de Comandos`

#### Scenario: Ordem dos menus
- **WHEN** o app é iniciado
- **THEN** a barra de menus exibe `Arquivo`, `Edição`, `Ferramentas`, o menu
  de visualização e, por último, `Ajuda`

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
