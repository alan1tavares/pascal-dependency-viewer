## Purpose

Guardar entre sessões os Projetos (`.dpr`) abertos anteriormente e permitir
reabri-los rapidamente por um diálogo de busca acionado por menu ou atalho
de teclado, sem passar pelo diálogo nativo de seleção de arquivo.

## ADDED Requirements

### Requirement: Registro persistente de Recent Projects
O sistema SHALL registrar como Recent Project o caminho absoluto do `.dpr` de
todo Project aberto com sucesso, seja por `Abrir projeto (.dpr)` seja por
`Abrir recente`. "Com sucesso" significa que o arquivo foi lido e parseado; um
diálogo nativo cancelado ou uma falha de leitura NÃO SHALL registrar nada.

A lista SHALL ser ordenada do mais recente para o mais antigo, SHALL NÃO ter
caminhos duplicados (reabrir um Project já presente o move para o topo) e
SHALL guardar no máximo 10 entradas (ao exceder, a mais antiga é descartada).
A lista SHALL persistir entre sessões do app.

Se a lista persistida não existir ou estiver ilegível, o sistema SHALL tratá-la
como vazia, sem exibir erro ao usuário.

#### Scenario: Abrir um Project o registra como recente
- **WHEN** o usuário abre `/proj/A.dpr` por `Abrir projeto (.dpr)` e o
  arquivo é lido e parseado com sucesso
- **THEN** `/proj/A.dpr` passa a ser a primeira entrada da lista de Recent
  Projects

#### Scenario: Reabrir um Project existente o move para o topo sem duplicar
- **WHEN** a lista é `[B, A]` e o usuário abre `A`
- **THEN** a lista passa a ser `[A, B]`, com uma única entrada para `A`

#### Scenario: Limite de 10 entradas
- **WHEN** a lista já tem 10 entradas e o usuário abre um Project que não
  está nela
- **THEN** o novo Project fica no topo e a entrada mais antiga é descartada,
  mantendo 10 entradas

#### Scenario: Diálogo nativo cancelado não registra nada
- **WHEN** o usuário aciona `Abrir projeto (.dpr)` e cancela o diálogo
  nativo
- **THEN** a lista de Recent Projects permanece inalterada

#### Scenario: Lista persiste entre sessões
- **WHEN** o usuário abre um Project, encerra o app e o abre de novo
- **THEN** esse Project aparece na lista de Recent Projects

#### Scenario: Lista persistida ausente ou ilegível
- **WHEN** o app é iniciado sem nenhuma lista persistida, ou com uma
  ilegível
- **THEN** a lista de Recent Projects é vazia e nenhum erro é exibido

### Requirement: Diálogo "Abrir recente" acionado por menu ou atalho em sequência
O sistema SHALL abrir o diálogo `Abrir recente` ao clicar no item `Abrir
recente` do menu `Arquivo` ou ao pressionar a sequência de teclas `Cmd+K` e,
em seguida, `R` (macOS) / `Ctrl+K` e, em seguida, `R` (Linux), com a janela em
foco e a partir de qualquer tela do app.

A sequência SHALL ser cancelada se, depois de `Cmd/Ctrl+K`, o usuário
pressionar qualquer tecla que não seja `R` ou se passarem 1,5 segundo sem
outra tecla. A tecla `R` que completa a sequência SHALL ser consumida (não
ser digitada em nenhum campo).

O diálogo SHALL abrir mesmo que nenhum Project tenha sido aberto na sessão.
Se o diálogo já estiver aberto, acionar o atalho ou o item de menu SHALL
apenas devolver o foco ao input, sem abrir uma segunda instância.

#### Scenario: Abrir pelo menu
- **WHEN** o usuário clica em `Arquivo > Abrir recente`
- **THEN** o diálogo `Abrir recente` é exibido

#### Scenario: Abrir pela sequência de atalho
- **WHEN** o usuário pressiona `Cmd+K` e depois `R` (macOS) ou `Ctrl+K` e
  depois `R` (Linux)
- **THEN** o diálogo `Abrir recente` é exibido e o caractere `r` não é
  digitado em nenhum campo

#### Scenario: Sequência cancelada por outra tecla
- **WHEN** o usuário pressiona `Cmd/Ctrl+K` e depois `X`
- **THEN** o diálogo não é aberto

#### Scenario: Sequência cancelada por timeout
- **WHEN** o usuário pressiona `Cmd/Ctrl+K` e só pressiona `R` mais de 1,5
  segundo depois
- **THEN** o diálogo não é aberto

#### Scenario: Diálogo já aberto
- **WHEN** o diálogo `Abrir recente` já está aberto e o usuário aciona o
  atalho ou o item de menu de novo
- **THEN** o foco volta ao input e continua existindo uma única instância do
  diálogo

#### Scenario: Diálogo abre sem Project carregado
- **WHEN** o usuário aciona `Abrir recente` antes de abrir qualquer
  Project na sessão
- **THEN** o diálogo é exibido normalmente

### Requirement: Aparência e conteúdo do diálogo "Abrir recente"
O diálogo SHALL ser exibido como um overlay dentro da página do app, no topo
e centralizado horizontalmente (no estilo da paleta de comandos do VS Code),
sobre a tela atual. Ele SHALL conter um input com o texto `Abrir recente`
exibido como prefixo fixo, não editável, e, abaixo do input, a lista de
Recent Projects (mais recente primeiro).

Cada linha da lista SHALL exibir o nome do arquivo `.dpr` e a pasta (caminho
completo) em que ele está. Ao abrir o diálogo, o primeiro item SHALL estar
destacado e o foco SHALL estar no input.

Se não houver nenhum Recent Project a exibir (lista vazia, ou nenhum item
casa com o filtro), o diálogo SHALL exibir a mensagem `Nenhum projeto
recente`.

#### Scenario: Diálogo lista os Recent Projects
- **WHEN** a lista de Recent Projects é `[A.dpr, B.dpr]` e o usuário abre o
  diálogo
- **THEN** o input mostra o prefixo `Abrir recente`, a lista mostra `A.dpr`
  e depois `B.dpr`, cada um com sua pasta, o primeiro item está destacado e
  o foco está no input

#### Scenario: Lista vazia
- **WHEN** não há nenhum Recent Project e o usuário abre o diálogo
- **THEN** o diálogo exibe `Nenhum projeto recente`

### Requirement: Filtro da lista de Recent Projects
O texto digitado no input SHALL filtrar a lista por substring, sem diferenciar
maiúsculas de minúsculas, comparada contra o nome do arquivo e contra o
caminho completo. A cada mudança do filtro o primeiro item da lista filtrada
SHALL ficar destacado.

#### Scenario: Filtro por nome do arquivo
- **WHEN** a lista tem `Vendas.dpr` e `Estoque.dpr` e o usuário digita `vend`
- **THEN** apenas `Vendas.dpr` é exibido

#### Scenario: Filtro por caminho
- **WHEN** a lista tem `/cliente1/App.dpr` e `/cliente2/App.dpr` e o
  usuário digita `cliente2`
- **THEN** apenas `/cliente2/App.dpr` é exibido

#### Scenario: Filtro sem resultado
- **WHEN** nenhum Recent Project casa com o texto digitado
- **THEN** o diálogo exibe `Nenhum projeto recente`

### Requirement: Navegação por teclado e fechamento do diálogo
No diálogo, `↑` e `↓` SHALL mover o destaque entre os itens da lista filtrada,
`Enter` SHALL abrir o item destacado, `Esc` SHALL fechar o diálogo sem efeito
colateral, e clicar fora do diálogo SHALL fechá-lo sem efeito colateral.
Clicar em um item SHALL abri-lo. `Enter` sem nenhum item na lista SHALL não ter
efeito.

#### Scenario: Navegar e abrir com o teclado
- **WHEN** o usuário pressiona `↓` e depois `Enter` com a lista `[A, B]`
- **THEN** `B` é aberto

#### Scenario: Fechar com Esc
- **WHEN** o usuário pressiona `Esc` com o diálogo aberto
- **THEN** o diálogo é fechado, a tela anterior permanece como estava e a
  lista de Recent Projects não muda

#### Scenario: Fechar clicando fora
- **WHEN** o usuário clica fora do diálogo
- **THEN** o diálogo é fechado sem efeito colateral

#### Scenario: Abrir com clique
- **WHEN** o usuário clica em um item da lista
- **THEN** esse Recent Project é aberto

### Requirement: Abrir um Recent Project
Ao escolher um Recent Project, o sistema SHALL fechar o diálogo e seguir o
mesmo fluxo de `Abrir projeto (.dpr)` a partir do arquivo escolhido, sem
abrir o diálogo nativo de seleção de arquivo: ler e parsear o `.dpr` com
`parseDprSource`, registrá-lo como recente (movendo-o para o topo) e notificar
o renderer via `app:project-loaded` com `{ projectUnits, projectDir }`, que
leva à tela de seleção de Root Unit.

#### Scenario: Escolher um Recent Project
- **WHEN** o usuário escolhe `A.dpr` no diálogo `Abrir recente`
- **THEN** o diálogo fecha, `A.dpr` é lido e parseado, vai para o topo da
  lista de Recent Projects e a tela de seleção de Root Unit é exibida com as
  Project Units de `A.dpr`

### Requirement: Recent Project cujo arquivo não existe mais
A lista exibida no diálogo NÃO SHALL ser filtrada por existência de arquivo
ao ser aberta. Se o usuário escolher um Recent Project cujo `.dpr` não existe
mais (ou não pode ser lido), o sistema SHALL fechar o diálogo, exibir uma
mensagem de erro nativa informando que o arquivo não foi encontrado, remover
essa entrada da lista persistida e NÃO SHALL alterar a tela atual do app.

#### Scenario: Arquivo removido do disco
- **WHEN** `/proj/Velho.dpr` está na lista mas foi apagado, e o usuário o
  escolhe
- **THEN** uma mensagem de erro é exibida, `Velho.dpr` é removido da lista de
  Recent Projects e a tela atual do app permanece como estava

#### Scenario: Entrada de arquivo ausente continua visível até ser escolhida
- **WHEN** um `.dpr` da lista foi apagado e o usuário abre o diálogo
- **THEN** a entrada ainda é exibida (nenhuma verificação de existência é
  feita ao abrir o diálogo)
