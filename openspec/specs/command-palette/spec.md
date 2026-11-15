# command-palette Specification

## Purpose
Dar acesso rápido, por teclado e pelo nome, às ações do app por meio de um
overlay de busca (a Command Palette), incluindo a troca para a lista de
Recent Projects.

## Requirements

### Requirement: Aparência e conteúdo do modo lista de Commands
A paleta SHALL ser exibida como um overlay dentro da página do app, no topo e
centralizado horizontalmente, sobre a Tab ativa, com o mesmo aspecto do
modo `Abrir recente`. No modo lista de Commands o input NÃO SHALL ter prefixo
fixo e SHALL exibir o texto de ajuda `Digite um comando` enquanto estiver
vazio. Abaixo do input SHALL haver a lista de Commands disponíveis.

Cada linha da lista SHALL exibir o rótulo do Command e, à direita, a dica do
seu atalho quando ele tiver um. Ao abrir a paleta, o primeiro item SHALL
estar destacado e o foco SHALL estar no input.

As dicas de atalho SHALL seguir a plataforma: `⌘O` (macOS) / `Ctrl+O`
(Linux) para `Abrir projeto (.dpr)` e `⌘K R` (macOS) / `Ctrl+K R` (Linux)
para `Abrir recente`. `Selecionar Unit`, `Selecionar Método` e `Bem-vindo`
não têm atalho e SHALL ser exibidos sem dica.

#### Scenario: Paleta lista os Commands com dicas de atalho
- **WHEN** um Project está aberto, a Welcome Tab está ativa e o usuário abre
  a paleta no Linux
- **THEN** o input mostra `Digite um comando` sem prefixo, a lista mostra
  `Abrir projeto (.dpr)` com `Ctrl+O`, `Abrir recente` com `Ctrl+K R`,
  `Selecionar Unit` sem dica e `Bem-vindo` sem dica, o primeiro item está
  destacado e o foco está no input

#### Scenario: Dicas de atalho no macOS
- **WHEN** o usuário abre a paleta no macOS
- **THEN** as dicas exibidas são `⌘O` e `⌘K R`

#### Scenario: Selecionar Método sem dica de atalho
- **WHEN** a Unit Tab `UnitA` está ativa e o usuário abre a paleta
- **THEN** `Selecionar Método` é exibido sem dica de atalho

### Requirement: Catálogo de Commands e disponibilidade
A lista de Commands SHALL conter, nesta ordem, `Abrir projeto (.dpr)`, `Abrir
recente`, `Selecionar Unit`, `Selecionar Método` e `Bem-vindo`. `Sair` e as
ações de fechar ou alternar Tabs NÃO SHALL ser Commands da paleta.

`Selecionar Unit` SHALL ser exibido somente se algum Project já tiver sido
aberto na sessão (mesmo critério usado por `Edição > Selecionar Unit`); caso
contrário SHALL ser omitido da lista. `Selecionar Método` SHALL ser exibido
somente quando a Tab ativa no momento em que a paleta é aberta é uma Unit
Tab; com a Welcome Tab ou uma Method Tab ativa SHALL ser omitido da lista.
`Bem-vindo` SHALL ser exibido sempre, inclusive quando a Welcome Tab já está
aberta.

#### Scenario: Sem Project aberto
- **WHEN** nenhum Project foi aberto na sessão e o usuário abre a paleta
- **THEN** a lista mostra `Abrir projeto (.dpr)`, `Abrir recente` e
  `Bem-vindo`, nessa ordem

#### Scenario: Com Project aberto
- **WHEN** um Project já foi aberto na sessão, a Welcome Tab está ativa e o
  usuário abre a paleta
- **THEN** a lista mostra `Abrir projeto (.dpr)`, `Abrir recente`,
  `Selecionar Unit` e `Bem-vindo`, nessa ordem

#### Scenario: Com uma Unit Tab ativa
- **WHEN** a Unit Tab `UnitA` está ativa e o usuário abre a paleta
- **THEN** a lista mostra `Abrir projeto (.dpr)`, `Abrir recente`,
  `Selecionar Unit`, `Selecionar Método` e `Bem-vindo`, nessa ordem

#### Scenario: Com uma Method Tab ativa
- **WHEN** a Method Tab `TCliente.Salvar` está ativa e o usuário abre a
  paleta
- **THEN** `Selecionar Método` não é exibido

#### Scenario: Selecionar Unit aparece após abrir um Project pela própria paleta
- **WHEN** o usuário abre um Project pelo Command `Abrir projeto (.dpr)` e
  abre a paleta de novo
- **THEN** `Selecionar Unit` passa a ser exibido

### Requirement: Filtro da lista de Commands
O texto digitado no input SHALL filtrar a lista de Commands por substring do
rótulo, sem diferenciar maiúsculas de minúsculas nem acentos. A ordem dos
Commands filtrados SHALL ser a ordem do catálogo, sem depender de uso
anterior. A cada mudança do filtro o primeiro item da lista filtrada SHALL
ficar destacado. Se nenhum Command casar com o filtro, a paleta SHALL exibir
a mensagem `Nenhum comando encontrado`.

#### Scenario: Filtro por parte do rótulo
- **WHEN** o usuário digita `recen`
- **THEN** apenas `Abrir recente` é exibido

#### Scenario: Filtro ignora maiúsculas
- **WHEN** o usuário digita `PROJETO`
- **THEN** `Abrir projeto (.dpr)` é exibido

#### Scenario: Filtro ignora acentos
- **WHEN** um rótulo do catálogo contém uma letra acentuada e o usuário
  digita esse rótulo com a letra sem acento (por exemplo `edicao` para um
  rótulo com `edição`), ou digita uma letra acentuada onde o rótulo não tem
  acento
- **THEN** o Command é exibido, porque a comparação desconsidera acentos nos
  dois lados

#### Scenario: Filtro sem resultado
- **WHEN** nenhum Command casa com o texto digitado
- **THEN** a paleta exibe `Nenhum comando encontrado`

### Requirement: Navegação por teclado e fechamento no modo lista de Commands
No modo lista de Commands, `↑` e `↓` SHALL mover o destaque entre os itens da
lista filtrada, `Enter` SHALL executar o item destacado, e `Esc` SHALL fechar
a paleta sem efeito colateral. Clicar fora da paleta SHALL fechá-la sem efeito
colateral e clicar em um item SHALL executá-lo. `Enter` sem nenhum item na
lista SHALL não ter efeito.

#### Scenario: Navegar e executar com o teclado
- **WHEN** a lista é `[Abrir projeto (.dpr), Abrir recente]` e o usuário
  pressiona `↓` e depois `Enter`
- **THEN** o Command `Abrir recente` é executado

#### Scenario: Fechar com Esc
- **WHEN** o usuário pressiona `Esc` na paleta no modo lista de Commands
- **THEN** a paleta é fechada e nenhum Command é executado

#### Scenario: Fechar clicando fora
- **WHEN** o usuário clica fora da paleta
- **THEN** a paleta é fechada sem efeito colateral

#### Scenario: Executar com clique
- **WHEN** o usuário clica em um item da lista
- **THEN** esse Command é executado

#### Scenario: Enter sem itens
- **WHEN** nenhum Command casa com o filtro e o usuário pressiona `Enter`
- **THEN** nada acontece e a paleta continua aberta

### Requirement: Execução de um Command
Ao executar um Command, a paleta SHALL se fechar antes de a ação ser
disparada, com exceção de `Abrir recente`, `Selecionar Unit` e `Selecionar
Método`, que trocam a paleta para o modo correspondente sem fechá-la.

- `Abrir projeto (.dpr)` SHALL seguir o mesmo fluxo do item `Arquivo > Abrir
  projeto (.dpr)`: abrir o diálogo nativo de seleção de `.dpr`, parsear o
  arquivo escolhido e notificar o renderer via `app:project-loaded`. Se o
  usuário cancelar o diálogo nativo, nenhum Project é carregado, o estado do
  app permanece como estava e a paleta NÃO SHALL reaparecer.
- `Selecionar Unit` SHALL trocar a paleta para o modo `Selecionar Unit` (ver
  requirement "Modo `Selecionar Unit` na Command Palette"), populado
  com as Project Units e o `projectDir` do último Project carregado, sem
  fechar a paleta.
- `Selecionar Método` SHALL trocar a paleta para o modo `Selecionar Método`
  (ver requirement "Modo `Selecionar Método` na Command Palette"), com os
  Methods da Root Unit da Unit Tab ativa, sem fechar a paleta.
- `Abrir recente` SHALL trocar o conteúdo da paleta para a lista de Recent
  Projects (modo `Abrir recente`), sem fechar a paleta.
- `Bem-vindo` SHALL seguir o mesmo fluxo do item `Ajuda > Bem-vindo`:
  ativar a Welcome Tab, abrindo-a antes se ela tiver sido fechada
  (capability `tabs`).

#### Scenario: Executar "Abrir projeto (.dpr)" pela paleta
- **WHEN** o usuário escolhe `Abrir projeto (.dpr)` na paleta e seleciona um
  `.dpr` no diálogo nativo
- **THEN** a paleta é fechada antes do diálogo nativo, o arquivo é parseado
  e a tela de seleção de Root Unit é exibida com as Project Units dele

#### Scenario: Cancelar o diálogo nativo aberto pela paleta
- **WHEN** o usuário escolhe `Abrir projeto (.dpr)` na paleta e cancela o
  diálogo nativo
- **THEN** nenhum evento `app:project-loaded` é enviado, o estado do app não
  muda e a paleta continua fechada

#### Scenario: Executar "Selecionar Unit" pela paleta
- **WHEN** um Project está aberto e o usuário escolhe `Selecionar Unit` na
  paleta
- **THEN** a paleta continua aberta e passa a exibir o modo `Selecionar
  Unit`, com a lista de Project Units do último Project carregado

#### Scenario: Executar "Selecionar Método" pela paleta
- **WHEN** a Unit Tab `UnitA` está ativa e o usuário escolhe `Selecionar
  Método` na paleta
- **THEN** a paleta continua aberta e passa a exibir o modo `Selecionar
  Método` para os Methods de `UnitA`

#### Scenario: Executar "Abrir recente" pela paleta
- **WHEN** o usuário escolhe `Abrir recente` na paleta
- **THEN** a paleta continua aberta e passa a exibir o modo `Abrir recente`,
  com o prefixo fixo `Abrir recente` e a lista de Recent Projects

#### Scenario: Executar "Bem-vindo" pela paleta
- **WHEN** a Welcome Tab foi fechada, a Unit Tab `UnitA` está ativa e o
  usuário escolhe `Bem-vindo` na paleta
- **THEN** a paleta é fechada e a Welcome Tab é aberta no fim da barra e
  fica ativa

### Requirement: Modo "Selecionar Unit" na Command Palette
A Command Palette SHALL ter um terceiro modo, `Selecionar Unit`, cuja
aparência, filtro e navegação por teclado são os definidos na capability
`root-unit-selection`. A paleta SHALL entrar nesse modo:

- **automaticamente**, logo após um Project ser carregado
  (`app:project-loaded`);
- **ao executar o Command `Selecionar Unit`** estando a paleta aberta na
  lista de Commands;
- **ao acionar o item `Edição > Selecionar Unit`** (capability
  `application-menu`), mesmo que a paleta esteja fechada ou aberta em outro
  modo.

O modo `Selecionar Unit` SHALL ser sempre fechável sem escolher nada. `Esc`
SHALL voltar à lista de Commands (com o input vazio) quando a paleta chegou
a esse modo pelo Command `Selecionar Unit`, e SHALL fechar a paleta inteira
nas outras duas entradas. O clique fora do card, nas três entradas, SHALL
fechar a paleta inteira, sem voltar à lista de Commands.

Escolher uma Project Unit nesse modo SHALL fechar a paleta e exibir o
grafo dessa Root Unit numa Unit Tab, como definido na capability
`root-unit-selection`.

#### Scenario: Modo Selecionar Unit exibido ao carregar um Project
- **WHEN** o usuário abre um `.dpr`
- **THEN** a Command Palette é exibida automaticamente no modo `Selecionar
  Unit`

#### Scenario: Esc fecha a paleta na abertura automática
- **WHEN** a paleta está no modo `Selecionar Unit` exibido automaticamente
  ao carregar um Project e o usuário pressiona `Esc` ou clica fora do card
- **THEN** a paleta fecha, sem nenhuma Root Unit escolhida

#### Scenario: Esc volta à lista de Commands quando aberto pelo Command
- **WHEN** a paleta está aberta, o usuário executa o Command `Selecionar
  Unit` e pressiona `Esc`
- **THEN** a paleta exibe a lista de Commands, com o input vazio

#### Scenario: Clique fora fecha tudo quando aberto pelo Command
- **WHEN** nas mesmas condições do cenário anterior, o usuário clica fora
  do card em vez de pressionar `Esc`
- **THEN** a paleta fecha inteiramente, sem voltar à lista de Commands

#### Scenario: Esc fecha tudo quando aberto pelo menu Edição
- **WHEN** o usuário aciona `Edição > Selecionar Unit` com um Project
  carregado, e pressiona `Esc`
- **THEN** a paleta fecha inteiramente

#### Scenario: Escolher uma Project Unit no modo Selecionar Unit
- **WHEN** o usuário escolhe `UnitB` no modo `Selecionar Unit`
- **THEN** a paleta fecha e o grafo de `UnitB` é exibido na Unit Tab
  `UnitB`, que fica ativa

### Requirement: Modo "Abrir recente" na Command Palette
A Command Palette SHALL ter um segundo modo, `Abrir recente`, cuja aparência,
filtro e navegação são os definidos na capability `recent-projects`. A
paleta SHALL entrar nesse modo ao executar o Command `Abrir recente` ou
quando o usuário aciona o item `Arquivo > Abrir recente` ou a sequência
`Cmd/Ctrl+K R`, mesmo que a paleta esteja fechada ou aberta em qualquer
outro modo.

`Esc` no modo `Abrir recente` SHALL voltar à lista de Commands (com o input
vazio) quando a paleta chegou a esse modo pelo Command `Abrir recente`, e
SHALL fechar a paleta quando chegou por `Arquivo > Abrir recente` ou pela
sequência `Cmd/Ctrl+K R`.

#### Scenario: Esc volta à lista de Commands
- **WHEN** o usuário abre a paleta com `Cmd/Ctrl+P`, escolhe `Abrir recente`
  e pressiona `Esc`
- **THEN** a paleta exibe a lista de Commands, com o input vazio

#### Scenario: Esc fecha tudo quando aberto direto no modo recentes
- **WHEN** o usuário pressiona `Cmd/Ctrl+K R` e depois `Esc`
- **THEN** a paleta é fechada

#### Scenario: Sequência de atalho com a paleta aberta na lista de Commands
- **WHEN** a paleta está aberta no modo lista de Commands e o usuário
  pressiona `Cmd/Ctrl+K R`
- **THEN** a paleta passa a exibir o modo `Abrir recente`, e `Esc` nesse
  modo a fecha

#### Scenario: Escolher um Recent Project a partir da paleta
- **WHEN** o usuário chega ao modo `Abrir recente` pelo Command e escolhe
  `A.dpr`
- **THEN** a paleta é fechada, `A.dpr` é aberto como descrito na capability
  `recent-projects` e a tela de seleção de Root Unit é exibida

#### Scenario: Cmd/Ctrl+K R logo após carregar um Project
- **WHEN** a paleta está aberta no modo `Selecionar Unit` exibido
  automaticamente ao carregar um Project, e o usuário aciona
  `Cmd/Ctrl+K R`
- **THEN** a paleta passa a exibir o modo `Abrir recente`

### Requirement: Abertura da Command Palette pelo menu ou pelo atalho
O sistema SHALL abrir a Command Palette, no modo lista de Commands, ao clicar
no item `Paleta de Comandos` do menu `Ferramentas` ou ao pressionar `Cmd+P`
(macOS) / `Ctrl+P` (Linux), com a janela em foco e a partir de qualquer Tab
do app. A paleta SHALL abrir mesmo que nenhum Project tenha sido aberto na
sessão.

Se a paleta já estiver aberta, acionar o atalho ou o item de menu SHALL
devolver o foco ao input no modo lista de Commands, sem abrir uma segunda
instância: se ela estava no modo `Abrir recente` ou `Selecionar Unit`,
volta à lista de Commands.

#### Scenario: Abrir pelo menu
- **WHEN** o usuário clica em `Ferramentas > Paleta de Comandos`
- **THEN** a Command Palette é exibida no modo lista de Commands

#### Scenario: Abrir pelo atalho
- **WHEN** o usuário pressiona `Cmd+P` (macOS) ou `Ctrl+P` (Linux)
- **THEN** a Command Palette é exibida no modo lista de Commands

#### Scenario: Paleta abre sem Project carregado
- **WHEN** o usuário aciona a paleta antes de abrir qualquer Project na
  sessão
- **THEN** a paleta é exibida normalmente

#### Scenario: Paleta já aberta
- **WHEN** a paleta já está aberta no modo lista de Commands e o usuário
  aciona o atalho ou o item de menu de novo
- **THEN** o foco volta ao input e continua existindo uma única instância da
  paleta

#### Scenario: Atalho da paleta com a paleta no modo recentes
- **WHEN** a paleta está aberta no modo `Abrir recente` e o usuário aciona
  `Cmd/Ctrl+P`
- **THEN** a paleta passa a exibir a lista de Commands, com o input vazio e
  o foco nele

#### Scenario: Atalho da paleta logo após carregar um Project
- **WHEN** a paleta está aberta no modo `Selecionar Unit` exibido
  automaticamente ao carregar um Project, e o usuário pressiona
  `Cmd/Ctrl+P`
- **THEN** a paleta passa a exibir a lista de Commands, com o input vazio e
  o foco nele

### Requirement: Modo "Selecionar Método" na Command Palette
A Command Palette SHALL ter um modo `Selecionar Método`, que lista os
Methods da Root Unit da Unit Tab ativa no momento em que o modo é aberto. A
paleta SHALL entrar nesse modo:

- **ao executar o Command `Selecionar Método`** estando a paleta aberta na
  lista de Commands;
- **ao acionar o item `Edição > Selecionar Método`** (capability
  `application-menu`), mesmo que a paleta esteja fechada ou aberta em outro
  modo.

O input SHALL exibir o prefixo fixo `Selecionar Método` e o texto de ajuda
`Digite o nome do método` enquanto estiver vazio. Cada linha SHALL exibir o
rótulo do Method: `NomeDaClasse.NomeDoMethod` para Methods de classe e só
`NomeDoMethod` para Methods soltos. A lista SHALL seguir a ordem em que os
Methods aparecem no fonte da Unit, e o texto digitado SHALL filtrá-la por
substring do rótulo, sem diferenciar maiúsculas de minúsculas nem acentos,
com o primeiro item filtrado destacado. `↑`/`↓` SHALL mover o destaque,
`Enter` e o clique SHALL escolher o Method.

#### Scenario: Lista de Methods da Unit Tab ativa
- **WHEN** a Unit Tab `UnitCliente` está ativa, seu fonte implementa, nesta
  ordem, `TCliente.Salvar`, `FormatarCpf` e `TCliente.Carregar`, e o usuário
  entra no modo `Selecionar Método`
- **THEN** a lista mostra `TCliente.Salvar`, `FormatarCpf` e
  `TCliente.Carregar`, nessa ordem, com o primeiro destacado

#### Scenario: Filtro por parte do rótulo
- **WHEN** a lista do cenário anterior está exibida e o usuário digita
  `cliente.`
- **THEN** apenas `TCliente.Salvar` e `TCliente.Carregar` são exibidos

#### Scenario: Filtro sem resultado
- **WHEN** nenhum Method casa com o texto digitado
- **THEN** a paleta exibe `Nenhum método encontrado`

### Requirement: Modo "Selecionar Método" enquanto o Project é analisado
Quando a paleta entra no modo `Selecionar Método` e a análise do Project
ainda não terminou, a paleta SHALL entrar no modo imediatamente e exibir
`Analisando Project…` no lugar da lista, até a análise terminar; então
SHALL exibir a lista de Methods, aplicando o texto já digitado como filtro.
Fechar a paleta durante a análise SHALL não interromper a análise: uma
próxima entrada no modo SHALL encontrar o resultado pronto, sem analisar o
Project de novo. Se outro Project for carregado durante a análise, o
resultado da análise anterior SHALL ser descartado sem nenhuma mensagem de
erro ao usuário.

#### Scenario: Primeira entrada no modo
- **WHEN** nenhum Method foi selecionado ainda no Project e o usuário entra
  no modo `Selecionar Método`
- **THEN** a paleta mostra `Analisando Project…` e, ao fim da análise, a
  lista de Methods

#### Scenario: Outro Project carregado durante a análise
- **WHEN** a paleta mostra `Analisando Project…` e o usuário carrega outro
  `.dpr` por `Cmd/Ctrl+K R`
- **THEN** nenhum alerta é exibido, nenhum Method do Project anterior é
  listado e o app segue o fluxo normal de carregamento do novo Project

#### Scenario: Esc durante a análise
- **WHEN** a paleta mostra `Analisando Project…`, o usuário pressiona `Esc`
  até fechá-la, espera e entra de novo no modo `Selecionar Método`
- **THEN** a lista de Methods é exibida sem a mensagem `Analisando Project…`

### Requirement: Unit sem Methods ou não analisada no modo "Selecionar Método"
Quando a Root Unit da Unit Tab ativa não implementa nenhum Method, o modo
`Selecionar Método` SHALL exibir a mensagem `Esta Unit não tem métodos` no
lugar da lista.

Quando a própria Root Unit da Unit Tab ativa não pôde ser analisada, o modo
SHALL exibir, no lugar da lista, a mensagem `Não foi possível analisar esta
Unit` seguida do motivo da falha.

#### Scenario: Unit só com declarações
- **WHEN** a Unit Tab `UnitConstantes` está ativa, a Unit não tem nenhuma
  procedure ou function com corpo, e o usuário entra no modo `Selecionar
  Método`
- **THEN** a paleta exibe `Esta Unit não tem métodos`

#### Scenario: Unit que não pôde ser analisada
- **WHEN** a Unit Tab `UnitLegada` está ativa, o parser não conseguiu
  analisá-la, e o usuário entra no modo `Selecionar Método`
- **THEN** a paleta exibe `Não foi possível analisar esta Unit` e o motivo,
  sem lista de Methods

### Requirement: Fechamento do modo "Selecionar Método"
O modo `Selecionar Método` SHALL ser sempre fechável sem escolher nada.
`Esc` SHALL voltar à lista de Commands (com o input vazio) quando a paleta
chegou a esse modo pelo Command `Selecionar Método`, e SHALL fechar a paleta
inteira quando chegou por `Edição > Selecionar Método`. O clique fora do
card SHALL fechar a paleta inteira nas duas entradas.

#### Scenario: Esc volta à lista de Commands quando aberto pelo Command
- **WHEN** a paleta está aberta, o usuário executa o Command `Selecionar
  Método` e pressiona `Esc`
- **THEN** a paleta exibe a lista de Commands, com o input vazio

#### Scenario: Esc fecha tudo quando aberto pelo menu Edição
- **WHEN** o usuário aciona `Edição > Selecionar Método` com uma Unit Tab
  ativa e pressiona `Esc`
- **THEN** a paleta fecha inteiramente e as Tabs continuam como estavam

#### Scenario: Clique fora fecha tudo
- **WHEN** a paleta está no modo `Selecionar Método`, por qualquer entrada,
  e o usuário clica fora do card
- **THEN** a paleta fecha inteiramente

### Requirement: Escolher um Method abre sua Method Tab
Escolher um Method no modo `Selecionar Método` SHALL fechar a paleta e
exibir o Caller Graph desse Method numa Method Tab, como definido na
capability `tabs`: abrindo uma nova Method Tab se o Method ainda não tem
uma, ou ativando a existente.

#### Scenario: Escolher um Method
- **WHEN** o usuário escolhe `TCliente.Salvar` no modo `Selecionar Método`
- **THEN** a paleta fecha e a Method Tab `TCliente.Salvar` é exibida, ativa,
  com o Caller Graph de `TCliente.Salvar`
