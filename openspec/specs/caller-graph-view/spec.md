# caller-graph-view Specification

## Purpose

Define como a Method Tab desenha o Caller Graph de um Target Method: um grafo
lido de baixo para cima, do Target Method na base até os Entry Points e
demais Callers mais externos no topo.

## Requirements

### Requirement: Orientação de baixo para cima
O Caller Graph SHALL ser desenhado em camadas verticais com o Target Method
na camada mais baixa, sozinho, e cada Caller numa camada acima de todos os
Methods que ele chama dentro do grafo — exceto quando a chamada fecha um
ciclo (ver "Recursão e ciclos"). Callers sem Callers próprios no grafo
SHALL ficar no topo dos seus ramos.

#### Scenario: Cadeia simples
- **WHEN** o Target Method é `TCliente.Salvar`, chamado por
  `TFormCliente.BtnSalvarClick`, que não tem Callers
- **THEN** `TCliente.Salvar` aparece embaixo e `TFormCliente.BtnSalvarClick`
  aparece numa camada acima dele

#### Scenario: Ramificação
- **WHEN** o Target Method `Validar` é chamado por `A` e por `B`, e `A` é
  chamado por `C`
- **THEN** `Validar` fica na base, `A` e `B` acima dele e `C` acima de `A`

### Requirement: Destaque do Target Method
O nó do Target Method SHALL ter um estilo que o distingue de todos os
outros nós do grafo (cor e borda próprias, mais fortes), e o grafo SHALL
ser enquadrado ao ser exibido pela primeira vez de modo que o Target Method
fique visível.

#### Scenario: Target Method destacado
- **WHEN** a Method Tab `TCliente.Salvar` é aberta
- **THEN** o nó `TCliente.Salvar` aparece na base com o estilo de Target
  Method, diferente do estilo de todos os outros nós

### Requirement: Arestas apontam do Caller para o Method chamado
Cada chamada SHALL ser desenhada como uma aresta com seta que sai do Caller
e aponta para o Method chamado — portanto, no fluxo normal, apontando para
baixo. Um mesmo par Caller/Method chamado SHALL ter uma única aresta, por
mais vezes que a chamada se repita no código.

#### Scenario: Seta para baixo
- **WHEN** `TFormCliente.BtnSalvarClick` chama `TCliente.Salvar`, o Target
  Method
- **THEN** a seta sai de `TFormCliente.BtnSalvarClick`, acima, e aponta para
  `TCliente.Salvar`, abaixo

#### Scenario: Chamada repetida
- **WHEN** `A` chama o Target Method três vezes em seu corpo
- **THEN** há uma única aresta de `A` para o Target Method

### Requirement: Recursão e ciclos
Cada Method SHALL aparecer uma única vez no Caller Graph. Uma chamada de um
Method a si mesmo SHALL ser desenhada como uma aresta circular que sai e
volta ao próprio nó. Uma chamada que fecha um ciclo entre Methods distintos
(back-edge) SHALL ser desenhada tracejada, sem alterar a orientação de baixo
para cima das demais arestas; todas as outras arestas SHALL ser contínuas.

#### Scenario: Auto-recursão
- **WHEN** o Target Method `Fatorial` chama a si mesmo
- **THEN** `Fatorial` aparece uma única vez, com uma aresta circular no
  próprio nó

#### Scenario: Ciclo mútuo
- **WHEN** o Target Method `A` é chamado por `B`, e `B` é chamado por `A`
- **THEN** `A` fica na base e `B` acima dele, a aresta de `B` para `A` é
  contínua e a aresta de `A` para `B`, que fecha o ciclo, é tracejada

### Requirement: Polymorphic Calls
Uma Polymorphic Call SHALL ser desenhada como uma aresta direta do Caller
para o Method alcançado, com uma cor própria, diferente da cor das chamadas
diretas. Ao passar o cursor sobre essa aresta, o sistema SHALL exibir como
tooltip `via ` seguido do rótulo da declaração pela qual a chamada foi feita.
Nenhum nó SHALL ser criado para essa declaração.

#### Scenario: Chamada pela classe ancestral
- **WHEN** o Target Method é `TClientePJ.Salvar`, que sobrescreve
  `TCliente.Salvar`, e `Gravar` chama `Salvar` numa variável do tipo
  `TCliente`
- **THEN** há uma aresta de `Gravar` para `TClientePJ.Salvar` com a cor de
  Polymorphic Call e tooltip `via TCliente.Salvar`, e não há nó
  `TCliente.Salvar` por causa dessa chamada

#### Scenario: Chamada por interface
- **WHEN** o Target Method é `TCliente.Salvar`, que implementa
  `ICliente.Salvar`, e `Gravar` chama `Salvar` numa variável do tipo
  `ICliente`
- **THEN** a aresta de `Gravar` para `TCliente.Salvar` tem a cor de
  Polymorphic Call e tooltip `via ICliente.Salvar`

### Requirement: Estilos de nós
Os nós SHALL usar estilos que distinguem:
- o Target Method (ver "Destaque do Target Method");
- os Methods que são Entry Points, com uma cor própria;
- os blocos que não são Methods — o bloco principal do Project e as seções
  `initialization`/`finalization` de uma Unit —, com a mesma cor dos Entry
  Points e um formato de nó diferente do formato dos Methods;
- os demais Methods, com um estilo neutro.

Se o próprio Target Method for um Entry Point, o estilo de Target Method
SHALL prevalecer.

#### Scenario: Handler de formulário
- **WHEN** `TFormCliente.BtnSalvarClick` está ligado ao `OnClick` de um botão
  no `.dfm` de `UnitFormCliente` e chama o Target Method
- **THEN** o nó `TFormCliente.BtnSalvarClick` usa a cor de Entry Point

#### Scenario: Bloco de initialization
- **WHEN** a seção `initialization` de `UnitConfig` chama o Target Method
- **THEN** há um nó `UnitConfig (initialization)` com a cor de Entry Point e
  formato diferente do formato dos Methods

#### Scenario: Bloco principal do Project
- **WHEN** o bloco `begin..end` do `.dpr` chama o Target Method
- **THEN** há um nó `Programa` com a cor de Entry Point e o formato dos
  blocos

#### Scenario: Method intermediário
- **WHEN** `A` chama o Target Method, é chamado por outro Method e não é
  Entry Point
- **THEN** o nó `A` usa o estilo neutro

### Requirement: Rótulos dos nós
O nó de um Method SHALL exibir, na primeira linha, o rótulo do Method
(`NomeDaClasse.NomeDoMethod` ou só `NomeDoMethod`) e, na segunda linha, o
nome da sua Unit. O nó do bloco principal do Project SHALL exibir
`Programa`, e o de uma seção `initialization`/`finalization` SHALL exibir o
nome da Unit seguido de `(initialization)` ou `(finalization)`.

#### Scenario: Rótulo de um Method de classe
- **WHEN** o grafo contém `TCliente.Salvar`, da Unit `UnitCliente`
- **THEN** o nó exibe `TCliente.Salvar` na primeira linha e `UnitCliente`
  na segunda

### Requirement: Aviso de Units não analisadas
Quando uma ou mais Project Units não puderam ser analisadas, a Method Tab
SHALL exibir, junto ao Caller Graph, um aviso que informa que o grafo pode
estar incompleto e lista os nomes dessas Units. O Caller Graph SHALL ser
exibido mesmo assim. Sem Units não analisadas, nenhum aviso SHALL ser
exibido.

#### Scenario: Uma Unit não analisada
- **WHEN** a Project Unit `UnitLegada` não pôde ser analisada e o usuário
  abre a Method Tab `TCliente.Salvar`
- **THEN** o Caller Graph é exibido e um aviso lista `UnitLegada`

#### Scenario: Todas as Units analisadas
- **WHEN** todas as Project Units foram analisadas
- **THEN** a Method Tab não exibe aviso

### Requirement: Target Method sem Callers
Quando nenhum Caller do Target Method é encontrado, a Method Tab SHALL
exibir apenas o nó do Target Method, com o seu destaque.

#### Scenario: Method não chamado
- **WHEN** nenhuma parte do Project chama `TCliente.Excluir` e o usuário o
  escolhe como Target Method
- **THEN** a Method Tab exibe só o nó `TCliente.Excluir`, destacado

### Requirement: Interação com o Caller Graph
A Method Tab SHALL permitir arrastar nós, dar zoom e mover o enquadramento,
como na Unit Tab. A Method Tab NÃO SHALL ter View Filter, e clicar ou dar
duplo clique num nó NÃO SHALL abrir Tabs nem alterar o Target Method.

#### Scenario: Duplo clique num Caller
- **WHEN** o usuário dá duplo clique no nó `TFormCliente.BtnSalvarClick`
- **THEN** nenhuma Tab é aberta ou ativada e o grafo continua o mesmo
