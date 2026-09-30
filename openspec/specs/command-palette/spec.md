# command-palette Specification

## Purpose
Dar acesso rápido, por teclado e pelo nome, às ações do app por meio de um
overlay de busca (a Command Palette), incluindo a troca para a lista de
Recent Projects.

## Requirements

### Requirement: Abertura da Command Palette por menu ou atalho
O sistema SHALL abrir a Command Palette, no modo lista de Commands, ao clicar
no item `Paleta de Comandos` do menu `Ferramentas` ou ao pressionar `Cmd+P`
(macOS) / `Ctrl+P` (Linux), com a janela em foco e a partir de qualquer tela
do app. A paleta SHALL abrir mesmo que nenhum Project tenha sido aberto na
sessão.

Se a paleta já estiver aberta, acionar o atalho ou o item de menu SHALL
devolver o foco ao input no modo lista de Commands, sem abrir uma segunda
instância: se ela estava no modo `Abrir recente`, volta à lista de Commands.

Se a paleta estiver aberta no modo `Selecionar Unit` (capability
`root-unit-selection`) e esse modo estiver marcado não-fechável — a
abertura automática que ocorre antes de qualquer Root Unit ter sido
escolhida para o Project atual —, acionar o atalho ou o item de menu SHALL
não ter efeito algum: a paleta permanece no modo `Selecionar Unit`.

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

#### Scenario: Atalho não tem efeito no modo Selecionar Unit obrigatório
- **WHEN** a paleta está aberta no modo `Selecionar Unit` obrigatório
  (nenhuma Root Unit escolhida ainda para o Project atual) e o usuário
  pressiona `Cmd/Ctrl+P`
- **THEN** nada acontece: a paleta permanece no modo `Selecionar Unit`, sem
  voltar à lista de Commands

### Requirement: Aparência e conteúdo do modo lista de Commands
A paleta SHALL ser exibida como um overlay dentro da página do app, no topo e
centralizado horizontalmente, sobre a tela atual, com o mesmo aspecto do
modo `Abrir recente`. No modo lista de Commands o input NÃO SHALL ter prefixo
fixo e SHALL exibir o texto de ajuda `Digite um comando` enquanto estiver
vazio. Abaixo do input SHALL haver a lista de Commands disponíveis.

Cada linha da lista SHALL exibir o rótulo do Command e, à direita, a dica do
seu atalho quando ele tiver um. Ao abrir a paleta, o primeiro item SHALL
estar destacado e o foco SHALL estar no input.

As dicas de atalho SHALL seguir a plataforma: `⌘O` (macOS) / `Ctrl+O`
(Linux) para `Abrir projeto (.dpr)` e `⌘K R` (macOS) / `Ctrl+K R` (Linux)
para `Abrir recente`. `Selecionar Unit` não tem atalho e SHALL ser exibido
sem dica.

#### Scenario: Paleta lista os Commands com dicas de atalho
- **WHEN** um Project está aberto e o usuário abre a paleta no Linux
- **THEN** o input mostra `Digite um comando` sem prefixo, a lista mostra
  `Abrir projeto (.dpr)` com `Ctrl+O`, `Abrir recente` com `Ctrl+K R` e
  `Selecionar Unit` sem dica, o primeiro item está destacado e o foco está no
  input

#### Scenario: Dicas de atalho no macOS
- **WHEN** o usuário abre a paleta no macOS
- **THEN** as dicas exibidas são `⌘O` e `⌘K R`

### Requirement: Catálogo de Commands e disponibilidade
A lista de Commands SHALL conter, nesta ordem, `Abrir projeto (.dpr)`, `Abrir
recente` e `Selecionar Unit`. `Selecionar Método` e `Sair` NÃO SHALL ser
Commands da paleta.

`Selecionar Unit` SHALL ser exibido somente se algum Project já tiver sido
aberto na sessão (mesmo critério usado por `Edição > Selecionar Unit`); caso
contrário SHALL ser omitido da lista.

#### Scenario: Sem Project aberto
- **WHEN** nenhum Project foi aberto na sessão e o usuário abre a paleta
- **THEN** a lista mostra apenas `Abrir projeto (.dpr)` e `Abrir recente`

#### Scenario: Com Project aberto
- **WHEN** um Project já foi aberto na sessão e o usuário abre a paleta
- **THEN** a lista mostra `Abrir projeto (.dpr)`, `Abrir recente` e
  `Selecionar Unit`, nessa ordem

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
disparada, com exceção de `Abrir recente` e `Selecionar Unit`, que trocam a
paleta para o modo correspondente sem fechá-la.

- `Abrir projeto (.dpr)` SHALL seguir o mesmo fluxo do item `Arquivo > Abrir
  projeto (.dpr)`: abrir o diálogo nativo de seleção de `.dpr`, parsear o
  arquivo escolhido e notificar o renderer via `app:project-loaded`. Se o
  usuário cancelar o diálogo nativo, nenhum Project é carregado, o estado do
  app permanece como estava e a paleta NÃO SHALL reaparecer.
- `Selecionar Unit` SHALL trocar a paleta para o modo `Selecionar Unit` (ver
  requirement "Modo `Selecionar Unit` dentro da Command Palette"), populado
  com as Project Units e o `projectDir` do último Project carregado, sem
  fechar a paleta.
- `Abrir recente` SHALL trocar o conteúdo da paleta para a lista de Recent
  Projects (modo `Abrir recente`), sem fechar a paleta.

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

#### Scenario: Executar "Abrir recente" pela paleta
- **WHEN** o usuário escolhe `Abrir recente` na paleta
- **THEN** a paleta continua aberta e passa a exibir o modo `Abrir recente`,
  com o prefixo fixo `Abrir recente` e a lista de Recent Projects

### Requirement: Modo "Abrir recente" dentro da Command Palette
A Command Palette SHALL ter um segundo modo, `Abrir recente`, cuja aparência,
filtro e navegação são os definidos na capability `recent-projects`. A
paleta SHALL entrar nesse modo ao executar o Command `Abrir recente` ou
quando o usuário aciona o item `Arquivo > Abrir recente` ou a sequência
`Cmd/Ctrl+K R`, mesmo que a paleta esteja fechada ou aberta no modo lista de
Commands.

`Esc` no modo `Abrir recente` SHALL voltar à lista de Commands (com o input
vazio) quando a paleta chegou a esse modo pelo Command `Abrir recente`, e
SHALL fechar a paleta quando chegou por `Arquivo > Abrir recente` ou pela
sequência `Cmd/Ctrl+K R`.

Enquanto a paleta estiver no modo `Selecionar Unit` (capability
`root-unit-selection`) marcado não-fechável, a sequência `Cmd/Ctrl+K R`
SHALL não ter efeito algum: a paleta permanece no modo `Selecionar Unit`.

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

#### Scenario: Cmd/Ctrl+K R não tem efeito no modo Selecionar Unit obrigatório
- **WHEN** a paleta está aberta no modo `Selecionar Unit` obrigatório e o
  usuário aciona `Cmd/Ctrl+K R`
- **THEN** nada acontece: a paleta permanece no modo `Selecionar Unit`

### Requirement: Modo "Selecionar Unit" dentro da Command Palette
A Command Palette SHALL ter um terceiro modo, `Selecionar Unit`, cuja
aparência, filtro e navegação por teclado são os definidos na capability
`root-unit-selection`. A paleta SHALL entrar nesse modo:

- **automaticamente**, logo após um Project ser carregado
  (`app:project-loaded`), antes de qualquer Root Unit ter sido escolhida
  para esse Project nesta sessão — nesse caso o modo SHALL ser marcado
  não-fechável;
- **ao executar o Command `Selecionar Unit`** estando a paleta aberta na
  lista de Commands — nesse caso o modo SHALL ser fechável;
- **ao acionar o item `Edição > Selecionar Unit`** (capability
  `application-menu`), mesmo que a paleta esteja fechada ou aberta em outro
  modo — nesse caso o modo SHALL ser fechável.

Um modo `Selecionar Unit` não-fechável SHALL ignorar `Esc`, o clique fora do
card e os atalhos que trocariam de modo (`Cmd/Ctrl+P`, `Cmd/Ctrl+K R`):
nenhum deles SHALL ter efeito algum enquanto o modo permanecer não-fechável.
Ele deixa de ser não-fechável assim que uma Root Unit é escolhida nesse modo
para o Project atual.

Num modo `Selecionar Unit` fechável, `Esc` SHALL voltar à lista de Commands
(com o input vazio) quando a paleta chegou a esse modo pelo Command
`Selecionar Unit`, e SHALL fechar a paleta inteira quando chegou por
`Edição > Selecionar Unit`. O clique fora do card, em ambos os casos, SHALL
fechar a paleta inteira, sem voltar à lista de Commands.

Escolher uma Project Unit nesse modo SHALL fechar a paleta e exibir o
grafo dessa Root Unit, como definido na capability `root-unit-selection`.

#### Scenario: Modo Selecionar Unit obrigatório ao carregar um Project
- **WHEN** o usuário abre um `.dpr` e nenhuma Root Unit foi escolhida ainda
  nesta sessão para esse Project
- **THEN** a Command Palette é exibida automaticamente no modo `Selecionar
  Unit`, marcada não-fechável

#### Scenario: Esc e clique fora não têm efeito no modo obrigatório
- **WHEN** a paleta está no modo `Selecionar Unit` obrigatório e o usuário
  pressiona `Esc` ou clica fora do card
- **THEN** nada acontece e a paleta permanece no modo `Selecionar Unit`

#### Scenario: Modo deixa de ser obrigatório após a primeira escolha
- **WHEN** o usuário escolhe uma Project Unit no modo `Selecionar Unit`
  obrigatório
- **THEN** o grafo é exibido e, a partir daí, qualquer nova entrada no modo
  `Selecionar Unit` para esse Project é fechável

#### Scenario: Esc volta à lista de Commands quando aberto pelo Command
- **WHEN** a paleta está aberta, o usuário executa o Command `Selecionar
  Unit` e pressiona `Esc`
- **THEN** a paleta exibe a lista de Commands, com o input vazio

#### Scenario: Clique fora fecha tudo quando aberto pelo Command
- **WHEN** nas mesmas condições do cenário anterior, o usuário clica fora
  do card em vez de pressionar `Esc`
- **THEN** a paleta fecha inteiramente, sem voltar à lista de Commands

#### Scenario: Esc fecha tudo quando aberto pelo menu Edição
- **WHEN** o usuário aciona `Edição > Selecionar Unit` com um grafo já
  renderizado, e pressiona `Esc`
- **THEN** a paleta fecha inteiramente

#### Scenario: Escolher uma Project Unit no modo Selecionar Unit
- **WHEN** o usuário escolhe `UnitB` no modo `Selecionar Unit`
- **THEN** a paleta fecha e o grafo de `UnitB` é exibido
