# Spec Delta

## REMOVED Requirements

### Requirement: "Selecionar Método" exibe apenas um aviso de funcionalidade pendente
**Reason**: A funcionalidade foi implementada; o item passa a abrir o modo
`Selecionar Método` da Command Palette.
**Migration**: Ver o requirement "\"Selecionar Método\" abre o modo
Selecionar Método" nesta capability e o modo `Selecionar Método` na
capability `command-palette`.

## ADDED Requirements

### Requirement: "Selecionar Método" abre o modo Selecionar Método
Ao clicar em `Edição > Selecionar Método`, o sistema SHALL exibir a Command
Palette no modo `Selecionar Método` (capability `command-palette`) para a
Root Unit da Unit Tab ativa, mesmo que a paleta esteja fechada ou aberta em
outro modo. O item NÃO SHALL ter atalho de teclado.

#### Scenario: Usuário clica em "Selecionar Método" com uma Unit Tab ativa
- **WHEN** a Unit Tab `UnitA` está ativa e o usuário clica em `Edição >
  Selecionar Método`
- **THEN** a Command Palette é exibida no modo `Selecionar Método` com os
  Methods de `UnitA`, e nenhum diálogo nativo é exibido

#### Scenario: Paleta aberta em outro modo
- **WHEN** a paleta está aberta na lista de Commands, a Unit Tab `UnitA`
  está ativa, e o usuário clica em `Edição > Selecionar Método`
- **THEN** a paleta passa a exibir o modo `Selecionar Método`

### Requirement: "Selecionar Método" desabilitado fora de uma Unit Tab
O item `Edição > Selecionar Método` SHALL estar habilitado somente enquanto
a Tab ativa é uma Unit Tab, e desabilitado (visível, mas sem resposta ao
clique) enquanto a Tab ativa é a Welcome Tab ou uma Method Tab. O estado do
item SHALL acompanhar cada troca da Tab ativa — por clique na aba, atalho,
abertura ou fechamento de Tab, ou abertura de um Project.

#### Scenario: App iniciado
- **WHEN** o app é iniciado e só a Welcome Tab está aberta
- **THEN** `Edição > Selecionar Método` está desabilitado

#### Scenario: Unit Tab ativada
- **WHEN** o usuário escolhe a Root Unit `UnitA` e a Unit Tab `UnitA` fica
  ativa
- **THEN** `Edição > Selecionar Método` fica habilitado

#### Scenario: Method Tab ativada
- **WHEN** a Unit Tab `UnitA` está ativa e o usuário escolhe um Method, que
  abre e ativa uma Method Tab
- **THEN** `Edição > Selecionar Método` fica desabilitado

#### Scenario: Voltar para a Welcome Tab
- **WHEN** a Unit Tab `UnitA` está ativa e o usuário ativa a Welcome Tab
- **THEN** `Edição > Selecionar Método` fica desabilitado
