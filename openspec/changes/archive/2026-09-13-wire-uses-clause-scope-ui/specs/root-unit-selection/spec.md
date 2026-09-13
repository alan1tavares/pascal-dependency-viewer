## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Seleção de uma Root Unit renderiza seu grafo de dependências direto
Ao escolher uma Project Unit na tela de busca/listagem como Root Unit, o
sistema SHALL ler o arquivo `.pas` correspondente (caminho resolvido a
partir do diretório do `.dpr` aberto) e renderizar o grafo de 1 nível dessa
unidade — a unidade e suas dependências diretas (`uses`) — usando
`parsePascalSource` e `mountDependenceGraphStructure`, sem exigir reabrir ou
recarregar a janela manualmente. A cláusula `uses` da Root Unit SHALL ser
extraída de acordo com o valor do controle de Uses Clause Scope da tela no
momento do clique (`interface` ou `interface + implementation`). Cada
dependência direta SHALL ser classificada como Project Unit ou External
Unit, comparando seu nome contra a lista de Project Units do Projeto
aberto, e o grafo renderizado SHALL exibir as External Unit com um estilo
visual distinto (nó folha) das Project Unit.

#### Scenario: Usuário escolhe uma Root Unit na listagem
- **WHEN** o usuário clica na Project Unit `UnitPrincipal` (caminho
  `UnitPrincipal.pas`, relativo ao diretório do `.dpr` aberto) na tela de
  busca/listagem
- **THEN** o app lê `UnitPrincipal.pas` do disco, extrai seu nome de unit e
  sua cláusula `uses`, e exibe o grafo com o nó `UnitPrincipal` e um edge
  para cada dependência direta, no mesmo formato que `File > Open` produz
  para um `.pas` avulso

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
