# Spec Delta

## ADDED Requirements

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
