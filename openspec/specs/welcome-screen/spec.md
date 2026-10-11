# welcome-screen Specification

## Purpose

Mostra a tela inicial do app (sem Projeto aberto, ou Projeto aberto
aguardando a escolha de uma Root Unit) e garante que ela nunca concorra
visualmente com o Dependency Graph depois que o primeiro grafo é
renderizado.

## Requirements

### Requirement: Estados exibidos antes do primeiro grafo
Enquanto nenhum Dependency Graph tiver sido renderizado nesta sessão do
app, o sistema SHALL exibir a tela de Bem-vindo em um de dois estados:
- **Sem Projeto aberto**: mensagem de boas-vindas, descrição do app e um
  botão para abrir um Projeto (`.dpr`).
- **Projeto aberto, sem Root Unit escolhida**: confirmação de que o
  Projeto foi carregado (caminho do diretório) e instrução para escolher
  uma Unit na Command Palette.

#### Scenario: App aberto sem nenhum Projeto carregado
- **WHEN** o app é iniciado e nenhum Projeto foi aberto ainda
- **THEN** o sistema exibe o estado "Sem Projeto aberto" da tela de
  Bem-vindo

#### Scenario: Projeto carregado antes de qualquer Root Unit ser escolhida
- **WHEN** um Projeto `.dpr` é carregado e nenhuma Root Unit foi
  escolhida ainda nesta sessão do Projeto
- **THEN** o sistema exibe o estado "Projeto aberto, sem Root Unit
  escolhida" da tela de Bem-vindo

### Requirement: Ocultação definitiva após o primeiro grafo renderizado
A partir do momento em que o primeiro Dependency Graph é renderizado
nesta sessão do app, o sistema SHALL ocultar completamente a tela de
Bem-vindo (não apenas posicioná-la atrás do grafo) e SHALL mantê-la
oculta pelo restante da sessão do app, independentemente de qualquer
evento que normalmente a mostraria antes do primeiro grafo — incluindo
abrir um novo Projeto ou reabrir a tela de seleção de Root Unit.

#### Scenario: Grafo renderizado ao escolher a Root Unit
- **WHEN** o usuário escolhe uma Root Unit e o Dependency Graph é
  renderizado por este motivo
- **THEN** a tela de Bem-vindo é ocultada imediatamente, sem aparecer
  atrás, abaixo ou sobre o grafo

#### Scenario: Novo Projeto aberto depois do primeiro grafo já ter sido renderizado
- **WHEN** o usuário abre um novo Projeto `.dpr` (ou reabre um Projeto
  recente) depois de já ter renderizado um Dependency Graph nesta sessão
  do app
- **THEN** o sistema não volta a exibir a tela de Bem-vindo em nenhum dos
  seus dois estados, mesmo enquanto esse novo Projeto ainda não tem uma
  Root Unit escolhida
