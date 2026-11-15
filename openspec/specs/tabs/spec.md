# tabs Specification

## Purpose

Organiza a área principal da janela em Tabs no estilo das abas de editor do
VSCode: uma Welcome Tab e uma Unit Tab por Root Unit, com uma única Tab
ativa por vez.

## Requirements

### Requirement: Barra de Tabs sempre visível
O sistema SHALL exibir, no topo da área principal da janela, uma barra com
uma aba para cada Tab aberta, na ordem em que foram abertas. A barra SHALL
estar sempre visível, mesmo com uma única Tab aberta. Exatamente uma Tab
SHALL estar ativa por vez: só o conteúdo dela é exibido, e a aba dela é
destacada na barra. Clicar numa aba SHALL ativar a Tab correspondente.

#### Scenario: Barra visível com uma única Tab
- **WHEN** o app é iniciado
- **THEN** a barra de Tabs é exibida com uma única aba, `Bem-vindo`, ativa e
  destacada

#### Scenario: Ativar uma Tab pelo clique
- **WHEN** existem as Unit Tabs `UnitA` (ativa) e `UnitB`, e o usuário
  clica na aba `UnitB`
- **THEN** `UnitB` passa a ser a Tab ativa, seu grafo é exibido e o grafo
  de `UnitA` deixa de ser exibido

### Requirement: Rolagem horizontal da barra de Tabs
O sistema SHALL permitir qualquer quantidade de Tabs abertas. Quando as
abas não couberem na largura da barra, a barra SHALL rolar na horizontal,
sem quebrar em mais de uma linha e sem reduzir as abas até ficarem
ilegíveis. Ativar uma Tab cuja aba esteja fora da área visível da barra
SHALL rolar a barra até ela.

#### Scenario: Muitas Tabs abertas
- **WHEN** há mais Unit Tabs abertas do que cabem na largura da janela
- **THEN** a barra continua numa única linha e pode ser rolada na
  horizontal para mostrar as abas restantes

#### Scenario: Tab ativada fora da área visível
- **WHEN** a barra está rolada até o início e o usuário ativa, por atalho,
  uma Tab cuja aba está fora da área visível
- **THEN** a barra rola até que a aba da Tab ativa fique visível

### Requirement: Welcome Tab ao iniciar o app
Ao iniciar o app, o sistema SHALL abrir somente a Welcome Tab, ativa. Seu
título SHALL ser `Bem-vindo`. Existe no máximo uma Welcome Tab aberta.

#### Scenario: App iniciado
- **WHEN** o app é iniciado
- **THEN** a única Tab aberta é a Welcome Tab, com o título `Bem-vindo`, e
  ela está ativa

### Requirement: Escolher uma Root Unit abre uma Unit Tab
Quando o usuário escolhe uma Root Unit que ainda não tem Unit Tab aberta,
o sistema SHALL abrir uma nova Unit Tab com o Dependency Graph dessa Root
Unit, colocá-la no fim da barra e ativá-la. As demais Tabs abertas,
incluindo a Welcome Tab, SHALL continuar abertas.

#### Scenario: Primeira Root Unit escolhida
- **WHEN** um Project está carregado, só a Welcome Tab está aberta e o
  usuário escolhe a Root Unit `UnitA`
- **THEN** a barra exibe `Bem-vindo` e `UnitA`, nessa ordem, e a Unit Tab
  `UnitA` está ativa, mostrando o grafo de `UnitA`

#### Scenario: Segunda Root Unit escolhida
- **WHEN** as Tabs `Bem-vindo` e `UnitA` estão abertas e o usuário escolhe a
  Root Unit `UnitB`
- **THEN** a barra exibe `Bem-vindo`, `UnitA` e `UnitB`, nessa ordem, e
  `UnitB` está ativa

### Requirement: Root Unit que já tem Unit Tab apenas a ativa
Uma Unit Tab SHALL ser identificada pela sua Root Unit. Quando o usuário
escolhe uma Root Unit que já tem Unit Tab aberta, o sistema SHALL ativar
essa Unit Tab, sem abrir outra e sem recalcular o Dependency Graph. A Tab
SHALL manter sua posição na barra e seu estado de exibição.

#### Scenario: Escolher de novo uma Root Unit já aberta
- **WHEN** as Unit Tabs `UnitA` e `UnitB` estão abertas, `UnitB` está
  ativa, e o usuário escolhe `UnitA` em `Selecionar Unit`
- **THEN** `UnitA` passa a ser a Tab ativa, a barra continua com uma única
  aba `UnitA`, na mesma posição, e o grafo dela não é lido de novo do disco

### Requirement: Título e tooltip da Unit Tab
O título da aba de uma Unit Tab SHALL ser o nome da Root Unit, com a
capitalização declarada no Project. Ao passar o cursor sobre a aba, o
sistema SHALL exibir como tooltip o caminho do arquivo `.pas` da Root Unit,
como declarado no `.dpr`.

#### Scenario: Título e tooltip
- **WHEN** a Root Unit escolhida é `UnitPrincipal`, declarada no `.dpr` como
  `UnitPrincipal in 'src\UnitPrincipal.pas'`
- **THEN** a aba da Unit Tab exibe `UnitPrincipal` e o tooltip dela exibe
  `src\UnitPrincipal.pas`

### Requirement: Unit Tab preserva seu estado de exibição
Enquanto uma Unit Tab estiver aberta, o sistema SHALL preservar o seu
View Filter, a posição dos nós, o zoom e o enquadramento do grafo quando o
usuário ativa outra Tab e depois volta a ela. Voltar a uma Unit Tab SHALL
não recalcular o Dependency Graph nem ler arquivos do disco.

#### Scenario: Voltar a uma Unit Tab
- **WHEN** na Unit Tab `UnitA` o usuário desmarca "Implementation", arrasta
  um nó e dá zoom, ativa a Unit Tab `UnitB` e depois volta para `UnitA`
- **THEN** `UnitA` é exibida com "Implementation" desmarcada, o nó na
  posição para onde foi arrastado e o mesmo zoom e enquadramento, sem nova
  leitura de arquivos do disco

### Requirement: Fechar uma Tab
Cada aba SHALL ter um botão "x" que fecha a Tab correspondente, e
`Cmd+W` (macOS) / `Ctrl+W` (Linux) SHALL fechar a Tab ativa. Fechar uma
Unit Tab SHALL descartar o estado de exibição dela. `Cmd/Ctrl+W` SHALL
nunca fechar a janela do app.

#### Scenario: Fechar pelo "x"
- **WHEN** as Unit Tabs `UnitA` e `UnitB` estão abertas e o usuário clica
  no "x" da aba `UnitA`
- **THEN** a Tab `UnitA` é removida da barra e `UnitB` continua aberta

#### Scenario: Fechar pelo atalho
- **WHEN** a Unit Tab `UnitB` está ativa e o usuário pressiona `Cmd/Ctrl+W`
- **THEN** a Tab `UnitB` é fechada e a janela do app continua aberta

#### Scenario: Reabrir uma Root Unit depois de fechar sua Unit Tab
- **WHEN** o usuário fecha a Unit Tab `UnitA`, em que tinha alterado o
  View Filter, e depois escolhe `UnitA` de novo
- **THEN** uma nova Unit Tab `UnitA` é aberta no fim da barra, com o View
  Filter no estado inicial

### Requirement: Tab ativada ao fechar a Tab ativa
Ao fechar a Tab ativa, o sistema SHALL ativar, entre as Tabs que continuam
abertas, a que foi ativada mais recentemente. Fechar uma Tab que não está
ativa SHALL manter ativa a Tab que já estava.

#### Scenario: Fechar a Tab ativa
- **WHEN** as Tabs `Bem-vindo`, `UnitA` e `UnitB` estão abertas, o usuário
  ativou `UnitA`, depois `Bem-vindo`, depois `UnitB`, e fecha `UnitB`
- **THEN** `Bem-vindo` passa a ser a Tab ativa, por ter sido ativada mais
  recentemente que `UnitA`

#### Scenario: Fechar uma Tab que não está ativa
- **WHEN** `UnitA` está ativa e o usuário clica no "x" da aba `UnitB`
- **THEN** `UnitB` é fechada e `UnitA` continua ativa

### Requirement: Fechar a última Tab reabre a Welcome Tab
Quando o usuário fecha a única Tab aberta e ela é uma Unit Tab, o sistema
SHALL abrir a Welcome Tab e ativá-la, de modo que a área principal nunca
fique sem Tab.

#### Scenario: Fechar a única Unit Tab
- **WHEN** a Welcome Tab já foi fechada, só a Unit Tab `UnitA` está aberta
  e o usuário a fecha
- **THEN** a Welcome Tab é aberta e fica ativa

### Requirement: Welcome Tab sozinha não pode ser fechada
Quando a Welcome Tab é a única Tab aberta, sua aba SHALL não exibir o botão
"x" e `Cmd/Ctrl+W` SHALL não ter efeito. Com outras Tabs abertas, a Welcome
Tab SHALL poder ser fechada normalmente.

#### Scenario: Só a Welcome Tab aberta
- **WHEN** a Welcome Tab é a única Tab aberta
- **THEN** sua aba não tem botão "x", e pressionar `Cmd/Ctrl+W` não muda
  nada

#### Scenario: Welcome Tab com uma Unit Tab aberta
- **WHEN** as Tabs `Bem-vindo` e `UnitA` estão abertas
- **THEN** a aba `Bem-vindo` exibe o botão "x" e pode ser fechada

### Requirement: Navegar entre Tabs pelo teclado
`Ctrl+Tab` SHALL ativar a Tab à direita da Tab ativa na barra, e
`Ctrl+Shift+Tab` a Tab à esquerda, nos dois casos em ciclo: depois da
última vem a primeira, e antes da primeira vem a última. O atalho é o mesmo
no macOS e no Linux. Com uma única Tab aberta, os atalhos SHALL não ter
efeito.

#### Scenario: Próxima Tab
- **WHEN** a barra tem `Bem-vindo`, `UnitA` e `UnitB`, `UnitA` está ativa e
  o usuário pressiona `Ctrl+Tab`
- **THEN** `UnitB` passa a ser a Tab ativa

#### Scenario: Próxima Tab em ciclo
- **WHEN** nas mesmas Tabs, `UnitB` está ativa e o usuário pressiona
  `Ctrl+Tab`
- **THEN** `Bem-vindo` passa a ser a Tab ativa

#### Scenario: Tab anterior em ciclo
- **WHEN** nas mesmas Tabs, `Bem-vindo` está ativa e o usuário pressiona
  `Ctrl+Shift+Tab`
- **THEN** `UnitB` passa a ser a Tab ativa

### Requirement: Atalhos de Tab fora da Command Palette e do menu
Os atalhos de fechar e de navegar entre Tabs SHALL não ser Commands da
Command Palette nem itens de menu. Enquanto a Command Palette estiver
aberta, eles SHALL não ter efeito.

#### Scenario: Atalho com a Command Palette aberta
- **WHEN** a Command Palette está aberta e o usuário pressiona `Cmd/Ctrl+W`
  ou `Ctrl+Tab`
- **THEN** nenhuma Tab é fechada ou ativada

#### Scenario: Ações de Tab não aparecem na paleta
- **WHEN** o usuário abre a Command Palette com Unit Tabs abertas
- **THEN** a lista de Commands não contém nenhum Command para fechar ou
  alternar Tabs

### Requirement: Reabrir a Welcome Tab
O Command `Bem-vindo` e o item de menu `Ajuda > Bem-vindo` SHALL ativar a
Welcome Tab se ela estiver aberta, ou abri-la no fim da barra e ativá-la se
tiver sido fechada.

#### Scenario: Welcome Tab fechada
- **WHEN** a Welcome Tab foi fechada, as Unit Tabs `UnitA` e `UnitB` estão
  abertas e o usuário aciona `Ajuda > Bem-vindo`
- **THEN** a barra exibe `UnitA`, `UnitB` e `Bem-vindo`, nessa ordem, e
  `Bem-vindo` está ativa

#### Scenario: Welcome Tab já aberta
- **WHEN** as Tabs `Bem-vindo` e `UnitA` estão abertas, `UnitA` está ativa, e
  o usuário executa o Command `Bem-vindo`
- **THEN** `Bem-vindo` passa a ser a Tab ativa e continua existindo uma
  única Welcome Tab

### Requirement: Abrir um Project fecha as Unit Tabs
Quando um Project é carregado — pelo diálogo nativo ou por `Abrir recente`,
inclusive quando é o mesmo `.dpr` que já estava aberto —, o sistema SHALL
fechar todas as Unit Tabs abertas. A Welcome Tab SHALL continuar aberta se
estava, e SHALL ser aberta se não estava, e fica ativa nos dois casos.
Cancelar o diálogo nativo ou falhar ao ler o Project SHALL não alterar as
Tabs.

#### Scenario: Abrir outro Project com Unit Tabs abertas
- **WHEN** as Tabs `Bem-vindo`, `UnitA` e `UnitB` estão abertas e o usuário
  abre outro `.dpr`
- **THEN** só a Welcome Tab continua aberta, ativa, e ela mostra o novo
  Project carregado

#### Scenario: Reabrir o mesmo Project
- **WHEN** a Welcome Tab foi fechada, a Unit Tab `UnitA` está aberta e o
  usuário reabre, por `Abrir recente`, o mesmo `.dpr` que já estava aberto
- **THEN** a Unit Tab `UnitA` é fechada e a Welcome Tab é aberta e fica
  ativa

#### Scenario: Cancelar o diálogo de abrir Project
- **WHEN** as Unit Tabs `UnitA` e `UnitB` estão abertas e o usuário abre o
  diálogo de `Abrir projeto (.dpr)` e o cancela
- **THEN** as Tabs abertas e a Tab ativa continuam as mesmas

### Requirement: Tabs não são persistidas entre sessões
O sistema SHALL não guardar as Tabs abertas entre sessões do app: ao
reiniciar, só a Welcome Tab é aberta.

#### Scenario: Reiniciar o app com Unit Tabs abertas
- **WHEN** o usuário fecha o app com as Unit Tabs `UnitA` e `UnitB` abertas
  e o inicia de novo
- **THEN** só a Welcome Tab está aberta

### Requirement: Escolher um Method abre uma Method Tab
Quando o usuário escolhe, no modo `Selecionar Método`, um Method que ainda
não tem Method Tab aberta, o sistema SHALL abrir uma nova Method Tab com o
Caller Graph desse Method como Target Method, colocá-la no fim da barra e
ativá-la. As demais Tabs abertas, incluindo a Unit Tab de onde o Method foi
escolhido, SHALL continuar abertas.

#### Scenario: Primeiro Method escolhido
- **WHEN** as Tabs `Bem-vindo` e `UnitCliente` estão abertas, `UnitCliente`
  está ativa, e o usuário escolhe `TCliente.Salvar`
- **THEN** a barra exibe `Bem-vindo`, `UnitCliente` e `TCliente.Salvar`,
  nessa ordem, e a Method Tab `TCliente.Salvar` está ativa, mostrando o
  Caller Graph de `TCliente.Salvar`

### Requirement: Method que já tem Method Tab apenas a ativa
Uma Method Tab SHALL ser identificada pelo seu Target Method — a Unit, a
classe (quando houver) e o nome do Method. Quando o usuário escolhe um
Method que já tem Method Tab aberta, o sistema SHALL ativar essa Method Tab,
sem abrir outra e sem recalcular o Caller Graph. A Tab SHALL manter sua
posição na barra e seu estado de exibição. Methods de mesmo rótulo em Units
diferentes SHALL ter Method Tabs distintas.

#### Scenario: Escolher de novo um Method já aberto
- **WHEN** a Method Tab `TCliente.Salvar` está aberta, a Unit Tab
  `UnitCliente` está ativa e o usuário escolhe de novo `TCliente.Salvar`
- **THEN** a Method Tab `TCliente.Salvar` existente passa a ser a Tab ativa,
  na mesma posição, e a barra continua com uma única aba para ela

#### Scenario: Mesmo rótulo em Units diferentes
- **WHEN** as Units `UnitA` e `UnitB` implementam, cada uma, um Method solto
  `Inicializar`, e o usuário escolhe `Inicializar` a partir da Unit Tab
  `UnitA` e depois a partir da Unit Tab `UnitB`
- **THEN** duas Method Tabs distintas, ambas com o título `Inicializar`,
  ficam abertas

### Requirement: Título e tooltip da Method Tab
O título da aba de uma Method Tab SHALL ser o rótulo do Target Method:
`NomeDaClasse.NomeDoMethod` para Methods de classe e só `NomeDoMethod` para
Methods soltos, com a capitalização declarada no fonte. Ao passar o cursor
sobre a aba, o sistema SHALL exibir como tooltip o nome da Unit do Target
Method seguido de ` — ` e do caminho do arquivo `.pas` dela, como declarado
no `.dpr`.

#### Scenario: Título e tooltip
- **WHEN** o Target Method é `TCliente.Salvar`, da Unit `UnitCliente`,
  declarada no `.dpr` como `UnitCliente in 'src\UnitCliente.pas'`
- **THEN** a aba exibe `TCliente.Salvar` e o tooltip exibe
  `UnitCliente — src\UnitCliente.pas`

### Requirement: Method Tab preserva seu estado de exibição
Enquanto uma Method Tab estiver aberta, o sistema SHALL preservar a posição
dos nós, o zoom e o enquadramento do Caller Graph quando o usuário ativa
outra Tab e depois volta a ela. Voltar a uma Method Tab SHALL não recalcular
o Caller Graph.

#### Scenario: Voltar a uma Method Tab
- **WHEN** na Method Tab `TCliente.Salvar` o usuário arrasta um nó e dá
  zoom, ativa outra Tab e depois volta para `TCliente.Salvar`
- **THEN** o Caller Graph é exibido com o nó na posição para onde foi
  arrastado e o mesmo zoom e enquadramento, sem ser recalculado

### Requirement: Abrir um Project fecha as Method Tabs
Quando um Project é carregado — pelo diálogo nativo ou por `Abrir recente`,
inclusive quando é o mesmo `.dpr` que já estava aberto —, o sistema SHALL
fechar todas as Method Tabs abertas, junto com as Unit Tabs, seguindo as
mesmas regras de Welcome Tab e de cancelamento definidas para as Unit Tabs.

#### Scenario: Abrir outro Project com Method Tabs abertas
- **WHEN** as Tabs `Bem-vindo`, `UnitCliente` e `TCliente.Salvar` estão
  abertas e o usuário abre outro `.dpr`
- **THEN** só a Welcome Tab continua aberta, ativa

#### Scenario: Cancelar o diálogo de abrir Project
- **WHEN** a Method Tab `TCliente.Salvar` está aberta e o usuário abre o
  diálogo de `Abrir projeto (.dpr)` e o cancela
- **THEN** a Method Tab `TCliente.Salvar` continua aberta e a Tab ativa não
  muda

### Requirement: Fechar a Unit Tab não fecha suas Method Tabs
Uma Method Tab SHALL ser independente da Unit Tab a partir da qual seu
Target Method foi escolhido: fechar essa Unit Tab SHALL não fechar nem
alterar a Method Tab.

#### Scenario: Fechar a Unit Tab de origem
- **WHEN** as Tabs `UnitCliente` e `TCliente.Salvar` estão abertas e o
  usuário fecha `UnitCliente`
- **THEN** a Method Tab `TCliente.Salvar` continua aberta, com o mesmo
  Caller Graph
