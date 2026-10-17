# Spec Delta

## MODIFIED Requirements

### Requirement: Estados exibidos antes do primeiro grafo
O conteúdo da Welcome Tab (capability `tabs`) SHALL ser a tela de
Bem-vindo, exibida em um de dois estados, conforme haja ou não um Project
carregado na sessão — independentemente de algum Dependency Graph já ter
sido renderizado ou de haver Graph Tabs abertas:
- **Sem Projeto aberto**: mensagem de boas-vindas, descrição do app e um
  botão para abrir um Projeto (`.dpr`).
- **Projeto aberto**: confirmação de que o Projeto foi carregado (caminho
  do diretório) e instrução para escolher uma Unit na Command Palette.

#### Scenario: App aberto sem nenhum Projeto carregado
- **WHEN** o app é iniciado e nenhum Projeto foi aberto ainda
- **THEN** a Welcome Tab exibe o estado "Sem Projeto aberto" da tela de
  Bem-vindo

#### Scenario: Projeto carregado antes de qualquer Root Unit ser escolhida
- **WHEN** um Projeto `.dpr` é carregado e nenhuma Root Unit foi
  escolhida ainda nesta sessão do Projeto
- **THEN** a Welcome Tab exibe o estado "Projeto aberto" da tela de
  Bem-vindo

#### Scenario: Welcome Tab ativada depois de um grafo renderizado
- **WHEN** um Projeto está carregado, a Graph Tab `UnitA` está aberta e o
  usuário ativa a Welcome Tab
- **THEN** a Welcome Tab exibe o estado "Projeto aberto" da tela de
  Bem-vindo, com o caminho do diretório desse Projeto

#### Scenario: Novo Projeto aberto depois de um grafo renderizado
- **WHEN** o usuário abre um novo Projeto `.dpr` (ou reabre um Projeto
  recente) depois de já ter renderizado um Dependency Graph nesta sessão
- **THEN** a Welcome Tab fica ativa e exibe o estado "Projeto aberto" com o
  caminho do diretório do novo Projeto

## REMOVED Requirements

### Requirement: Ocultação definitiva após o primeiro grafo renderizado
**Reason**: Com as Tabs, a tela de Bem-vindo vira a Welcome Tab, que
convive com as Graph Tabs na barra, e só some quando o usuário a fecha. Ela
não concorre visualmente com o grafo porque só o conteúdo da Tab ativa é
exibido.
**Migration**: O usuário fecha a Welcome Tab pelo "x" ou por `Cmd/Ctrl+W`
quando não quiser mais vê-la, e pode reabri-la pelo Command `Bem-vindo` ou
por `Ajuda > Bem-vindo` (capability `tabs`).
