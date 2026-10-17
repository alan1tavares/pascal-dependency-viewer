# root-unit-selection

## Purpose

Fluxo de abrir um Projeto (`.dpr`), listar suas Project Units numa tela de
busca/listagem e permitir a escolha de uma delas como Root Unit para
iniciar a visualização do grafo.

## Requirements

### Requirement: Abertura de um Projeto (`.dpr`) pelo menu
O sistema SHALL oferecer, no menu `Arquivo`, uma opção para abrir um
arquivo `.dpr` via diálogo nativo de seleção de arquivo. Essa opção
("Abrir projeto (.dpr)") SHALL ser a única entrada do menu `Arquivo` que abre
o diálogo nativo para carregar conteúdo Pascal — não há uma opção separada
para abrir um `.pas` avulso. O menu `Arquivo` também expõe `Abrir recente`
(capability `recent-projects`), que reabre um Projeto já aberto antes sem
passar pelo diálogo nativo, e `Sair` (capability `application-menu`), que
encerra a aplicação e não carrega nenhum conteúdo.

#### Scenario: Usuário abre um `.dpr` pelo menu
- **WHEN** o usuário escolhe "Abrir projeto (.dpr)" no menu `Arquivo` e
  seleciona um arquivo `.dpr` no diálogo
- **THEN** o conteúdo do arquivo é lido e parseado com `parseDprSource`, e a
  lista de Project Units resultante fica disponível para a tela de
  busca/listagem

#### Scenario: Menu `File` não tem opção de abrir um `.pas` avulso
- **WHEN** o usuário abre o menu `Arquivo`
- **THEN** a única opção que abre o diálogo nativo para carregar conteúdo é
  "Abrir projeto (.dpr)"; não existe uma opção "Open"/"Abrir" para um `.pas`
  avulso, `Abrir recente` reabre apenas Projetos já abertos antes, e `Sair`
  não carrega conteúdo nenhum

### Requirement: Listagem e busca de Project Units para escolha da Root Unit
Após abrir um Projeto, o sistema SHALL exibir todas as Project Units do
`.dpr` (nome e caminho) no modo `Selecionar Unit` da Command Palette
(capability `command-palette`): mesmo overlay/card já usado pelos demais
modos da paleta, cada item exibindo o nome da unit em destaque e o caminho
do arquivo como subtexto secundário. O sistema SHALL permitir filtrar a
lista por um texto digitado pelo usuário, comparado de forma
case-insensitive contra o nome da unit **e** contra o caminho do arquivo.

#### Scenario: Tela lista todas as Project Units do `.dpr` aberto
- **WHEN** o Projeto aberto tem Project Units `UnitA`, `UnitB` e `UnitC`
- **THEN** o modo `Selecionar Unit` da Command Palette exibe as três, cada
  uma com o nome em destaque e o caminho do arquivo como subtexto

#### Scenario: Usuário filtra a lista por texto
- **WHEN** o usuário digita `unitb` no campo de busca
- **THEN** somente as Project Units cujo nome contém `unitb`
  (case-insensitive) permanecem visíveis na lista

#### Scenario: Usuário filtra a lista por caminho do arquivo
- **WHEN** as Project Units listadas são `Vendas` (caminho
  `modulos/vendas/Vendas.pas`) e `Relatorios` (caminho
  `modulos/estoque/Relatorios.pas`), e o usuário digita `estoque`
- **THEN** somente `Relatorios` permanece visível, porque seu caminho
  contém `estoque` mesmo que seu nome não contenha

### Requirement: Navegação por teclado no modo Selecionar Unit
No modo `Selecionar Unit`, `↑` e `↓` SHALL mover o destaque entre os itens
da lista filtrada, com wrap-around (do último item o destaque volta ao
primeiro, e vice-versa), e `Enter` SHALL selecionar o item destacado como
Root Unit, com o mesmo efeito de clicar nele.

#### Scenario: Navegar e confirmar com o teclado
- **WHEN** a lista filtrada é `[UnitA, UnitB]` e o usuário pressiona `↓` e
  depois `Enter`
- **THEN** `UnitB` é selecionada como Root Unit e seu grafo é exibido

#### Scenario: Wrap-around na navegação
- **WHEN** o último item da lista filtrada está destacado e o usuário
  pressiona `↓`
- **THEN** o destaque volta para o primeiro item da lista

### Requirement: Seleção de uma Root Unit renderiza seu grafo de dependências direto
Ao escolher uma Project Unit na tela de busca/listagem como Root Unit, o
sistema SHALL exibir o Dependency Graph dessa Root Unit numa Graph Tab
(capability `tabs`): abre uma nova Graph Tab se a Root Unit ainda não tem
uma, ou ativa a existente, sem recalcular o grafo, se já tem. Para abrir
uma nova Graph Tab, o sistema SHALL expandir recursivamente todas as
Project Units alcançáveis a partir dela via `uses` — sempre considerando
tanto a seção `interface` quanto a `implementation` de cada unidade
visitada — produzindo o Dependency Graph completo, não apenas a Root Unit
e suas dependências diretas, usando `expandDependencyGraph` com um
`readFile` que resolve o caminho de cada Project Unit a partir do
diretório do `.dpr` aberto, sem exigir reabrir ou recarregar a janela
manualmente. Cada dependência encontrada durante a expansão SHALL ser
classificada como Project Unit ou External Unit, comparando seu nome
contra a lista de Project Units do Projeto aberto, e o grafo renderizado
SHALL exibir as External Unit com um estilo visual distinto (nó folha) das
Project Unit. Uma mesma unidade alcançável por mais de um caminho a partir
da Root Unit SHALL aparecer como um único nó no grafo renderizado. Quais
dessas arestas ficam visíveis ao usuário — de acordo com a Uses Clause
Origin de cada uma — é decidido pelo View Filter da Graph Tab (capability
`graph-view-filter`), não por nenhuma escolha feita nesta tela de
busca/listagem.

#### Scenario: Usuário escolhe uma Root Unit na listagem
- **WHEN** o usuário clica na Project Unit `UnitPrincipal` (caminho
  `UnitPrincipal.pas`, relativo ao diretório do `.dpr` aberto) na tela de
  busca/listagem
- **THEN** o app lê `UnitPrincipal.pas` do disco, extrai seu nome de unit e
  sua cláusula `uses`, e exibe, numa nova Graph Tab ativa, o grafo com o nó
  `UnitPrincipal` e um edge para cada dependência direta

#### Scenario: Root Unit escolhida já tem Graph Tab aberta
- **WHEN** a Graph Tab `UnitPrincipal` já está aberta e o usuário escolhe
  `UnitPrincipal` de novo na tela de busca/listagem
- **THEN** a Graph Tab `UnitPrincipal` existente é ativada e nenhum arquivo
  é lido do disco

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
  `interface` e `uses UnitB` só na seção `implementation`
- **THEN** o grafo gerado contém o edge `UnitPrincipal -> UnitA` — a tela
  de busca/listagem não tem mais nenhum controle cujo valor precise ser
  `interface` para isso acontecer, já que não existe mais escolha
  nenhuma nessa tela

#### Scenario: Root Unit escolhida com o controle em `interface + implementation`
- **WHEN** a Root Unit `UnitPrincipal` tem `uses UnitA` na seção
  `interface` e `uses UnitB` só na seção `implementation`
- **THEN** o grafo gerado contém também o edge `UnitPrincipal -> UnitB`,
  sempre, sem exigir nenhuma escolha prévia na tela de busca/listagem

#### Scenario: Escopo escolhido na tela vale para toda a expansão, não só a Root Unit
- **WHEN** a Root Unit `UnitPrincipal` tem `uses UnitA` (Project Unit) na
  seção `interface`, e `UnitA` tem `uses UnitB` (Project Unit) só na
  seção `implementation`
- **THEN** o grafo renderizado contém os edges `UnitPrincipal -> UnitA` e
  `UnitA -> UnitB` — o comportamento se aplica a toda a expansão, não só
  à Root Unit, e não depende de nenhuma escolha feita nesta tela

### Requirement: Origem da entrada no modo Selecionar Unit decide como ele fecha
O sistema SHALL abrir o modo `Selecionar Unit` da Command Palette a partir
de três origens distintas, sempre fechável sem selecionar nada, cada uma
com sua própria regra de fechamento (o mecanismo de modo/entrada é
definido pela capability `command-palette`):

- **Automática, ao carregar um Projeto**: exibida automaticamente logo após
  abrir um `.dpr`. `Esc` e o clique fora do card SHALL fechar a paleta
  inteira, sem selecionar nada. O Projeto continua carregado e a Welcome
  Tab continua ativa (capability `tabs`), de modo que o usuário pode
  escolher a Root Unit depois, pelo Command ou pelo menu `Selecionar Unit`.
- **Pelo Command `Selecionar Unit` da Command Palette**: só disponível
  depois de um Projeto já carregado. `Esc` SHALL fechar o modo e voltar à
  lista de Commands da paleta (com o input vazio), sem selecionar nada e
  sem alterar as Tabs. O clique fora do card SHALL fechar a paleta inteira
  (sem voltar à lista de Commands), também sem selecionar nada e sem
  alterar as Tabs.
- **Pelo menu `Edição > Selecionar Unit`** (capability `application-menu`):
  disponível apenas com um Projeto carregado. `Esc` e o clique fora do card
  SHALL igualmente fechar a paleta inteira, sem selecionar nada e sem
  alterar as Tabs.

#### Scenario: Esc fecha a paleta na abertura automática
- **WHEN** o usuário acabou de abrir um `.dpr`, o modo `Selecionar Unit` é
  exibido automaticamente, e o usuário pressiona `Esc` ou clica fora do
  card
- **THEN** a paleta fecha, nenhuma Graph Tab é aberta, a Welcome Tab
  continua ativa e o Projeto continua carregado

#### Scenario: Escolher a Root Unit depois de fechar a abertura automática
- **WHEN** nas mesmas condições do cenário anterior, depois de fechar a
  paleta o usuário aciona `Edição > Selecionar Unit` e escolhe `UnitA`
- **THEN** a Graph Tab `UnitA` é aberta e fica ativa

#### Scenario: Cmd/Ctrl+P e Cmd/Ctrl+K R trocam de modo na abertura automática
- **WHEN** nas mesmas condições do primeiro cenário, em vez de fechar a
  paleta o usuário pressiona `Cmd/Ctrl+P` ou aciona `Cmd/Ctrl+K R`
- **THEN** a paleta passa a exibir, respectivamente, a lista de Commands ou
  o modo `Abrir recente`, como a partir de qualquer outro modo

#### Scenario: Esc volta à lista de Commands quando aberto pelo Command da paleta
- **WHEN** o usuário abre a Command Palette, executa o Command `Selecionar
  Unit` e pressiona `Esc`
- **THEN** a paleta exibe a lista de Commands (input vazio), nenhuma nova
  Root Unit é selecionada e as Tabs abertas e a Tab ativa continuam as
  mesmas

#### Scenario: Clique fora fecha tudo quando aberto pelo Command da paleta
- **WHEN** nas mesmas condições do cenário anterior, o usuário clica fora
  do card em vez de pressionar `Esc`
- **THEN** a paleta fecha inteiramente (não volta à lista de Commands),
  nenhuma nova Root Unit é selecionada e as Tabs abertas e a Tab ativa
  continuam as mesmas

#### Scenario: Esc fecha tudo quando aberto pelo menu Edição
- **WHEN** o usuário reabre a Seleção de Unit via `Edição > Selecionar
  Unit` com a Graph Tab `UnitA` ativa, e pressiona `Esc`
- **THEN** a paleta fecha inteiramente, nenhuma nova Root Unit é
  selecionada e `UnitA` continua sendo a Tab ativa

#### Scenario: Clique fora fecha tudo quando aberto pelo menu Edição
- **WHEN** nas mesmas condições do cenário anterior, o usuário clica fora
  do card em vez de pressionar `Esc`
- **THEN** o mesmo efeito do cenário anterior ocorre
