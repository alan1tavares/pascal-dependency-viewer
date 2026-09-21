## MODIFIED Requirements

### Requirement: Diálogo "Abrir recente" acionado por menu ou atalho em sequência
O sistema SHALL abrir o diálogo `Abrir recente` — o modo `Abrir recente` da
Command Palette (capability `command-palette`) — ao clicar no item `Abrir
recente` do menu `Arquivo` ou ao pressionar a sequência de teclas `Cmd+K` e,
em seguida, `R` (macOS) / `Ctrl+K` e, em seguida, `R` (Linux), com a janela em
foco e a partir de qualquer tela do app. O diálogo também SHALL ser acessível
pelo Command `Abrir recente` da paleta.

A sequência SHALL ser cancelada se, depois de `Cmd/Ctrl+K`, o usuário
pressionar qualquer tecla que não seja `R` ou se passarem 1,5 segundo sem
outra tecla. A tecla `R` que completa a sequência SHALL ser consumida (não
ser digitada em nenhum campo).

O diálogo SHALL abrir mesmo que nenhum Project tenha sido aberto na sessão.
Se o diálogo já estiver aberto, acionar o atalho ou o item de menu SHALL
apenas devolver o foco ao input, sem abrir uma segunda instância. Se a
Command Palette estiver aberta no modo lista de Commands, acionar o atalho ou
o item de menu SHALL trocá-la para o modo `Abrir recente`.

#### Scenario: Abrir pelo menu
- **WHEN** o usuário clica em `Arquivo > Abrir recente`
- **THEN** o diálogo `Abrir recente` é exibido

#### Scenario: Abrir pela sequência de atalho
- **WHEN** o usuário pressiona `Cmd+K` e depois `R` (macOS) ou `Ctrl+K` e
  depois `R` (Linux)
- **THEN** o diálogo `Abrir recente` é exibido e o caractere `r` não é
  digitado em nenhum campo

#### Scenario: Abrir pelo Command da paleta
- **WHEN** o usuário escolhe o Command `Abrir recente` na Command Palette
- **THEN** o diálogo `Abrir recente` é exibido dentro da própria paleta

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

#### Scenario: Paleta aberta na lista de Commands
- **WHEN** a Command Palette está aberta no modo lista de Commands e o
  usuário aciona o atalho `Cmd/Ctrl+K R` ou `Arquivo > Abrir recente`
- **THEN** a paleta passa a exibir o diálogo `Abrir recente`, sem duplicar a
  instância

#### Scenario: Diálogo abre sem Project carregado
- **WHEN** o usuário aciona `Abrir recente` antes de abrir qualquer
  Project na sessão
- **THEN** o diálogo é exibido normalmente

### Requirement: Aparência e conteúdo do diálogo "Abrir recente"
O diálogo SHALL ser exibido como o modo `Abrir recente` do overlay da Command
Palette (capability `command-palette`) dentro da página do app, no topo e
centralizado horizontalmente (no estilo da paleta de comandos do VS Code),
sobre a tela atual. Ele SHALL conter um input com o texto `Abrir recente`
exibido como prefixo fixo, não editável, e, abaixo do input, a lista de
Recent Projects (mais recente primeiro). Neste documento, "o diálogo"
designa esse modo da paleta.

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

### Requirement: Navegação por teclado e fechamento do diálogo
No diálogo, `↑` e `↓` SHALL mover o destaque entre os itens da lista filtrada,
`Enter` SHALL abrir o item destacado, e clicar fora do diálogo SHALL fechá-lo
sem efeito colateral. Clicar em um item SHALL abri-lo. `Enter` sem nenhum
item na lista SHALL não ter efeito.

`Esc` SHALL sair do diálogo sem efeito colateral: se a paleta chegou ao modo
`Abrir recente` pelo Command `Abrir recente`, `Esc` volta à lista de Commands;
caso contrário (menu `Arquivo > Abrir recente` ou sequência `Cmd/Ctrl+K R`),
`Esc` fecha a paleta. A lista de Recent Projects não muda.

#### Scenario: Navegar e abrir com o teclado
- **WHEN** o usuário pressiona `↓` e depois `Enter` com a lista `[A, B]`
- **THEN** `B` é aberto

#### Scenario: Fechar com Esc
- **WHEN** o usuário pressiona `Esc` com o diálogo aberto pela sequência
  `Cmd/Ctrl+K R` ou por `Arquivo > Abrir recente`
- **THEN** a paleta é fechada, a tela anterior permanece como estava e a
  lista de Recent Projects não muda

#### Scenario: Esc volta à lista de Commands
- **WHEN** o usuário chegou ao diálogo pelo Command `Abrir recente` da
  paleta e pressiona `Esc`
- **THEN** a paleta exibe a lista de Commands e a lista de Recent Projects
  não muda

#### Scenario: Fechar clicando fora
- **WHEN** o usuário clica fora do diálogo
- **THEN** a paleta é fechada sem efeito colateral

#### Scenario: Abrir com clique
- **WHEN** o usuário clica em um item da lista
- **THEN** esse Recent Project é aberto
