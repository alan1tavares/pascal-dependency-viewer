# application-menu

## Purpose

Define a estrutura do menu nativo da aplicação (barra de menus do Electron):
os menus `Arquivo`, `Edição` e `Ferramentas` e as opções que cada um expõe ao usuário.

## Requirements

### Requirement: Menu `Arquivo` com "Abrir projeto (.dpr)", "Abrir recente" e "Sair"
O sistema SHALL expor um menu nativo rotulado `Arquivo` contendo exatamente
três opções, nesta ordem: `Abrir projeto (.dpr)`, `Abrir recente` e `Sair`.

`Abrir projeto (.dpr)` SHALL disparar exatamente o mesmo fluxo hoje disparado
pela opção `Abrir Projeto` (capability `root-unit-selection`): abrir o diálogo
nativo de seleção de arquivo `.dpr`, parsear o arquivo escolhido com
`parseDprSource`, e — se um arquivo foi escolhido — notificar o renderer via
o evento `app:project-loaded` com `{ projectUnits, projectDir }`.

`Abrir projeto (.dpr)` SHALL ter o atalho de teclado `Cmd+O` no macOS e
`Ctrl+O` no Linux, e o atalho SHALL ser exibido ao lado do rótulo do item no
menu `Arquivo`. Acionar o atalho SHALL produzir exatamente o mesmo efeito que
clicar no item, a partir de qualquer tela do app.

`Abrir recente` SHALL abrir o diálogo de projetos recentes (capability
`recent-projects`). Como o atalho dele é uma sequência de teclas (`Cmd+K`
seguido de `R` no macOS, `Ctrl+K` seguido de `R` no Linux), que o menu nativo
não consegue exibir como atalho, o rótulo do item SHALL incluir a dica
textual do atalho (por exemplo, `Abrir recente  ⌘K R` no macOS e `Abrir
recente  Ctrl+K R` no Linux). O comportamento da sequência é definido pela
capability `recent-projects`.

`Sair` SHALL encerrar a aplicação.

#### Scenario: Usuário abre o menu `Arquivo`
- **WHEN** o usuário abre o menu `Arquivo`
- **THEN** exatamente três opções são exibidas, nesta ordem: `Abrir projeto
  (.dpr)`, `Abrir recente` e `Sair`

#### Scenario: Atalho exibido no item "Abrir projeto (.dpr)"
- **WHEN** o usuário abre o menu `Arquivo` no macOS ou no Linux
- **THEN** o item `Abrir projeto (.dpr)` exibe o atalho `Cmd+O` (macOS) ou
  `Ctrl+O` (Linux) ao lado do rótulo

#### Scenario: Dica do atalho exibida no item "Abrir recente"
- **WHEN** o usuário abre o menu `Arquivo` no macOS ou no Linux
- **THEN** o rótulo do item `Abrir recente` inclui a dica `⌘K R` (macOS) ou
  `Ctrl+K R` (Linux)

#### Scenario: Usuário clica em "Abrir projeto (.dpr)"
- **WHEN** o usuário clica em `Abrir projeto (.dpr)` e escolhe um arquivo
  `.dpr` no diálogo nativo
- **THEN** o app lê e parseia o arquivo com `parseDprSource` e envia
  `{ projectUnits, projectDir }` ao renderer via `app:project-loaded`,
  exatamente como a opção `Abrir Projeto` fazia antes desta mudança

#### Scenario: Usuário clica em "Abrir recente"
- **WHEN** o usuário clica em `Abrir recente`
- **THEN** o diálogo de projetos recentes é exibido (capability
  `recent-projects`) e nenhum diálogo nativo de arquivo é aberto

#### Scenario: Usuário aciona o atalho de abrir projeto
- **WHEN** o usuário pressiona `Cmd+O` (macOS) ou `Ctrl+O` (Linux) com a
  janela do app em foco e escolhe um arquivo `.dpr` no diálogo nativo
- **THEN** o app se comporta exatamente como no clique em `Abrir projeto
  (.dpr)`: lê e parseia o arquivo com `parseDprSource` e envia
  `{ projectUnits, projectDir }` ao renderer via `app:project-loaded`

#### Scenario: Usuário aciona o atalho e cancela o diálogo
- **WHEN** o usuário pressiona o atalho de abrir projeto e fecha o diálogo
  nativo sem escolher um arquivo
- **THEN** nenhum evento `app:project-loaded` é enviado e o estado atual do
  renderer não muda

#### Scenario: Usuário clica em "Abrir projeto (.dpr)" e cancela o diálogo
- **WHEN** o usuário clica em `Abrir projeto (.dpr)` e fecha o diálogo
  nativo sem escolher um arquivo
- **THEN** nenhum evento `app:project-loaded` é enviado e o estado atual do
  renderer não muda

#### Scenario: Usuário clica em "Sair"
- **WHEN** o usuário clica em `Sair`
- **THEN** a aplicação é encerrada, sem exigir nenhuma confirmação
  adicional

### Requirement: Menu `Edição` com "Selecionar Unit" e "Selecionar Método"
O sistema SHALL expor um menu nativo rotulado `Edição` contendo exatamente
duas opções, nesta ordem: `Selecionar Unit` e `Selecionar Método`.

#### Scenario: Usuário abre o menu `Edição`
- **WHEN** o usuário abre o menu `Edição`
- **THEN** exatamente duas opções são exibidas, nesta ordem: `Selecionar
  Unit` e `Selecionar Método`

### Requirement: "Selecionar Método" exibe apenas um aviso de funcionalidade pendente
Ao clicar em `Selecionar Método`, o sistema SHALL exibir um diálogo/alerta
nativo informando que a funcionalidade ainda não foi implementada (por
exemplo, com o texto "Selecionar Método ainda será implementado"). Nenhum
outro efeito colateral SHALL ocorrer — nenhuma chamada IPC, nenhuma
alteração de estado do renderer, nenhuma navegação de tela.

#### Scenario: Usuário clica em "Selecionar Método"
- **WHEN** o usuário clica em `Selecionar Método`
- **THEN** um diálogo é exibido informando que a funcionalidade ainda será
  implementada, e nada mais acontece

#### Scenario: Fechar o diálogo não tem efeito colateral
- **WHEN** o usuário fecha o diálogo exibido por `Selecionar Método`
- **THEN** o estado do app permanece exatamente como estava antes do
  clique em `Selecionar Método`

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
