## RENAMED Requirements

- FROM: `### Requirement: Menu `Arquivo` com "Abrir Projeto" e "Sair"`
- TO: `### Requirement: Menu `Arquivo` com "Abrir projeto (.dpr)", "Abrir recente" e "Sair"`

## MODIFIED Requirements

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

#### Scenario: Atalho exibido no item "Abrir Projeto"
- **WHEN** o usuário abre o menu `Arquivo` no macOS ou no Linux
- **THEN** o item `Abrir projeto (.dpr)` exibe o atalho `Cmd+O` (macOS) ou
  `Ctrl+O` (Linux) ao lado do rótulo

#### Scenario: Dica do atalho exibida no item "Abrir recente"
- **WHEN** o usuário abre o menu `Arquivo` no macOS ou no Linux
- **THEN** o rótulo do item `Abrir recente` inclui a dica `⌘K R` (macOS) ou
  `Ctrl+K R` (Linux)

#### Scenario: Usuário clica em "Abrir Projeto"
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

#### Scenario: Usuário clica em "Abrir Projeto" e cancela o diálogo
- **WHEN** o usuário clica em `Abrir projeto (.dpr)` e fecha o diálogo
  nativo sem escolher um arquivo
- **THEN** nenhum evento `app:project-loaded` é enviado e o estado atual do
  renderer não muda

#### Scenario: Usuário clica em "Sair"
- **WHEN** o usuário clica em `Sair`
- **THEN** a aplicação é encerrada, sem exigir nenhuma confirmação
  adicional

### Requirement: "Selecionar Unit" reabre a tela de seleção de Root Unit
Ao clicar em `Selecionar Unit`, o sistema SHALL reabrir a tela de
busca/listagem de Root Unit já existente (capability
`root-unit-selection`), populada com as mesmas Project Units e o mesmo
`projectDir` do último Projeto carregado nesta sessão (seja pela opção
`Abrir projeto (.dpr)`, seja pela opção `Abrir recente`, seja por qualquer
expansão de grafo já feita a partir dele) — sem reabrir o diálogo nativo de
seleção de arquivo `.dpr` e sem reler o `.dpr` do disco. O usuário pode então
escolher uma Project Unit diferente como nova Root Unit, disparando a mesma
expansão de grafo já coberta pela capability `root-unit-selection`.

Se nenhum Projeto tiver sido carregado ainda nesta sessão (nenhum
`app:project-loaded` recebido), clicar em `Selecionar Unit` SHALL não ter
nenhum efeito visível — nem abrir a tela de Root Unit (que não teria
Project Units para listar), nem exibir qualquer diálogo.

#### Scenario: Usuário reabre a tela de Root Unit a partir do grafo já renderizado
- **WHEN** o usuário já abriu um Projeto (`UnitA`, `UnitB`, `UnitC` como
  Project Units), já escolheu `UnitA` como Root Unit e está vendo o grafo
  renderizado, e então clica em `Selecionar Unit` no menu `Edição`
- **THEN** a tela de busca/listagem de Root Unit é exibida novamente, com
  as mesmas três Project Units do Projeto aberto, sem precisar reabrir o
  `.dpr` pelo menu `Arquivo`

#### Scenario: Usuário escolhe uma nova Root Unit após reabrir a tela
- **WHEN**, a partir da tela reaberta por `Selecionar Unit`, o usuário
  clica em `UnitB`
- **THEN** o grafo é expandido a partir de `UnitB` exatamente como
  aconteceria ao escolher `UnitB` na tela original de Root Unit
  (capability `root-unit-selection`), substituindo o grafo de `UnitA`
  exibido anteriormente

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
