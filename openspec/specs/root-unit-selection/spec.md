# root-unit-selection

## Purpose

Fluxo de abrir um Projeto (`.dpr`), listar suas Project Units numa tela de
busca/listagem e permitir a escolha de uma delas como Root Unit para
iniciar a visualização do grafo.

## Requirements

### Requirement: Abertura de um Projeto (`.dpr`) pelo menu
O sistema SHALL oferecer, no menu `File`, uma opção para abrir um arquivo
`.dpr` via diálogo nativo de seleção de arquivo. Essa opção ("Open
Project") SHALL ser a única entrada do menu `File` para carregar
conteúdo Pascal — não há mais uma opção separada para abrir um `.pas`
avulso.

#### Scenario: Usuário abre um `.dpr` pelo menu
- **WHEN** o usuário escolhe "Open Project" no menu e seleciona um arquivo
  `.dpr` no diálogo
- **THEN** o conteúdo do arquivo é lido e parseado com `parseDprSource`, e a
  lista de Project Units resultante fica disponível para a tela de
  busca/listagem

#### Scenario: Menu `File` não tem opção de abrir um `.pas` avulso
- **WHEN** o usuário abre o menu `File`
- **THEN** a única opção disponível para carregar conteúdo é "Open
  Project"; não existe uma opção "Open" para um `.pas` avulso

### Requirement: Listagem e busca de Project Units para escolha da Root Unit
Após abrir um Projeto, o sistema SHALL exibir uma tela com todas as Project
Units do `.dpr` (nome e caminho), permitindo filtrar a lista por um texto
digitado pelo usuário, comparado de forma case-insensitive contra o nome da
unit.

#### Scenario: Tela lista todas as Project Units do `.dpr` aberto
- **WHEN** o Projeto aberto tem Project Units `UnitA`, `UnitB` e `UnitC`
- **THEN** a tela de busca/listagem exibe as três, com seus nomes e caminhos

#### Scenario: Usuário filtra a lista por texto
- **WHEN** o usuário digita `unitb` no campo de busca
- **THEN** somente as Project Units cujo nome contém `unitb`
  (case-insensitive) permanecem visíveis na lista

### Requirement: Controle de Uses Clause Scope na tela de busca/listagem
Ao exibir a tela de busca/listagem, o sistema SHALL oferecer um controle
com dois valores possíveis — `interface` e `interface + implementation` —
para escolher o Uses Clause Scope que será usado na próxima Root Unit
selecionada. O controle SHALL iniciar com `interface` selecionado, e sua
escolha SHALL valer apenas para a seleção de Root Unit feita enquanto ele
estiver com aquele valor — não é persistida em `electron-store` nem em
qualquer outro lugar entre gerações de grafo ou entre sessões do app.

#### Scenario: Tela de busca/listagem abre com escopo padrão
- **WHEN** o usuário abre um Projeto (`.dpr`) e a tela de busca/listagem é
  exibida
- **THEN** o controle de Uses Clause Scope exibe `interface` como valor
  selecionado

#### Scenario: Usuário troca o escopo antes de escolher a Root Unit
- **WHEN** o usuário seleciona `interface + implementation` no controle,
  sem ainda ter clicado em nenhuma Project Unit da lista
- **THEN** o controle passa a exibir `interface + implementation` como
  valor selecionado, e nenhuma navegação ou geração de grafo ocorre só por
  causa dessa troca

### Requirement: Seleção de uma Root Unit renderiza seu grafo de dependências direto
Ao escolher uma Project Unit na tela de busca/listagem como Root Unit, o
sistema SHALL expandir recursivamente todas as Project Units alcançáveis
a partir dela via `uses`, produzindo o Dependency Graph completo — não
apenas a Root Unit e suas dependências diretas — usando
`expandDependencyGraph` com um `readFile` que resolve o caminho de cada
Project Unit a partir do diretório do `.dpr` aberto, sem exigir reabrir ou
recarregar a janela manualmente. A cláusula `uses` de cada unidade
expandida SHALL ser extraída de acordo com o valor do controle de Uses
Clause Scope da tela no momento do clique (`interface` ou
`interface + implementation`), aplicado uniformemente à Root Unit e a
toda Project Unit alcançada transitivamente — não só à Root Unit. Cada
dependência encontrada durante a expansão SHALL ser classificada como
Project Unit ou External Unit, comparando seu nome contra a lista de
Project Units do Projeto aberto, e o grafo renderizado SHALL exibir as
External Unit com um estilo visual distinto (nó folha) das Project Unit.
Uma mesma unidade alcançável por mais de um caminho a partir da Root Unit
SHALL aparecer como um único nó no grafo renderizado.

#### Scenario: Usuário escolhe uma Root Unit na listagem
- **WHEN** o usuário clica na Project Unit `UnitPrincipal` (caminho
  `UnitPrincipal.pas`, relativo ao diretório do `.dpr` aberto) na tela de
  busca/listagem
- **THEN** o app lê `UnitPrincipal.pas` do disco, extrai seu nome de unit e
  sua cláusula `uses`, e exibe o grafo com o nó `UnitPrincipal` e um edge
  para cada dependência direta

#### Scenario: Dependência transitiva de uma Project Unit intermediária aparece no grafo
- **WHEN** a Root Unit `UnitPrincipal` tem, em sua cláusula `uses`, a
  dependência `UnitA` (Project Unit do `.dpr` aberto), e `UnitA` tem, por
  sua vez, `uses UnitB` (também Project Unit)
- **THEN** o grafo renderizado contém nós para `UnitPrincipal`, `UnitA` e
  `UnitB`, com edges `UnitPrincipal -> UnitA` e `UnitA -> UnitB`

#### Scenario: Dependência direta que é uma Project Unit do Projeto aberto
- **WHEN** a Root Unit `UnitPrincipal` tem, em sua cláusula `uses`, a
  dependência `UnitA`, e `UnitA` está presente na lista de Project Units
  do `.dpr` aberto
- **THEN** o nó `UnitA` é renderizado com o estilo de Project Unit

#### Scenario: Dependência direta que é uma External Unit
- **WHEN** a Root Unit `UnitPrincipal` tem, em sua cláusula `uses`, a
  dependência `Vcl.Forms`, e `Vcl.Forms` não está presente na lista de
  Project Units do `.dpr` aberto
- **THEN** o nó `Vcl.Forms` é renderizado com o estilo distinto de
  External Unit (nó folha)

#### Scenario: Root Unit escolhida com o controle em `interface` (padrão)
- **WHEN** a Root Unit `UnitPrincipal` tem `uses UnitA` na seção
  `interface` e `uses UnitB` só na seção `implementation`, e o controle de
  Uses Clause Scope está em `interface` no momento do clique
- **THEN** o grafo renderizado contém um edge de `UnitPrincipal` para
  `UnitA`, e nenhum edge para `UnitB`

#### Scenario: Root Unit escolhida com o controle em `interface + implementation`
- **WHEN** a Root Unit `UnitPrincipal` tem `uses UnitA` na seção
  `interface` e `uses UnitB` só na seção `implementation`, e o controle de
  Uses Clause Scope está em `interface + implementation` no momento do
  clique
- **THEN** o grafo renderizado contém um edge de `UnitPrincipal` para
  `UnitA` e outro para `UnitB`

#### Scenario: Escopo escolhido na tela vale para toda a expansão, não só a Root Unit
- **WHEN** a Root Unit `UnitPrincipal` tem `uses UnitA` (Project Unit) na
  seção `interface`, `UnitA` tem `uses UnitB` (Project Unit) só na seção
  `implementation`, e o controle de Uses Clause Scope está em
  `interface + implementation` no momento do clique
- **THEN** o grafo renderizado contém os edges `UnitPrincipal -> UnitA` e
  `UnitA -> UnitB`
