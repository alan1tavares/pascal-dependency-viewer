# Spec Delta

## Purpose

Manter no main process o índice de chamadas do Project aberto, montado sob
demanda e descartado ao trocar de Project, e expô-lo ao renderer pelos
canais IPC de listagem de Methods e de expansão do Caller Graph.

## ADDED Requirements

### Requirement: Índice montado sob demanda e reaproveitado
O main process SHALL montar o índice de chamadas do Project aberto apenas
quando ele for pedido pela primeira vez (por qualquer um dos canais IPC
desta capability), e SHALL reaproveitá-lo em todos os pedidos seguintes do
mesmo Project. Pedidos que chegam enquanto o índice está sendo montado SHALL
aguardar a mesma montagem, sem iniciar outra. A montagem SHALL prosseguir até
o fim mesmo que o renderer deixe de esperar pelo resultado. O main process
NÃO SHALL observar mudanças nos arquivos: alterações em disco só são
consideradas depois que um Project for carregado novamente.

#### Scenario: Segundo pedido não reanalisa
- **WHEN** o renderer pede a lista de Methods de uma Unit e, depois, o
  Caller Graph de um Method, no mesmo Project
- **THEN** os arquivos do Project são analisados uma única vez

#### Scenario: Pedidos concorrentes
- **WHEN** dois pedidos chegam antes de a primeira montagem terminar
- **THEN** ambos recebem o resultado da mesma montagem

#### Scenario: Arquivo alterado em disco
- **WHEN** um `.pas` é editado depois de o índice ter sido montado
- **THEN** os pedidos seguintes continuam usando o índice já montado

### Requirement: Índice descartado ao carregar outro Project
Sempre que um Project for carregado (pelo diálogo, por um Recent Project ou
recarregando o mesmo `.dpr`), o main process SHALL descartar o índice
anterior. Se uma montagem estiver em andamento para o Project anterior, seu
resultado SHALL ser descartado ao terminar, e os pedidos que a aguardavam
SHALL ser rejeitados com um erro identificável de "Project substituído", em
vez de receber dados do Project antigo.

#### Scenario: Troca de Project durante a análise
- **WHEN** o índice do Project `A.dpr` está sendo montado e o usuário carrega
  `B.dpr`
- **THEN** o pedido pendente é rejeitado como "Project substituído", e o
  próximo pedido monta o índice de `B.dpr`

#### Scenario: Reabrir o mesmo Project
- **WHEN** o usuário carrega novamente o `.dpr` já aberto
- **THEN** o próximo pedido monta o índice outra vez, refletindo o disco

### Requirement: Canal de listagem dos Methods de uma Unit
O sistema SHALL expor ao renderer uma chamada que recebe o nome de uma
Project Unit e retorna seus Methods, na ordem do fonte, cada um com seu `id`
e `label` (conforme `pascal-source-parsing`). Se a Unit não puder ser
analisada, a chamada SHALL retornar uma lista vazia acompanhada do motivo.
Se nenhum Project estiver carregado, a chamada SHALL falhar com um erro
identificável.

#### Scenario: Listar Methods
- **WHEN** o renderer pede os Methods de `UnitClientes`
- **THEN** recebe a lista de Methods dessa Unit, na ordem do fonte

#### Scenario: Unit não analisada
- **WHEN** o renderer pede os Methods de uma Unit que o parser não conseguiu
  analisar
- **THEN** recebe uma lista vazia e o motivo da falha

### Requirement: Canal de expansão do Caller Graph
O sistema SHALL expor ao renderer uma chamada que recebe o `id` de um Method
e retorna o Caller Graph desse Target Method no formato definido em
`caller-graph-expansion`. Se o `id` não corresponder a nenhum Method do
Project carregado, a chamada SHALL falhar com um erro identificável.

#### Scenario: Expandir Caller Graph
- **WHEN** o renderer pede o Caller Graph de `TCliente.Salvar`
- **THEN** recebe `{ nodes, edges, skippedUnits }` com `TCliente.Salvar`
  marcado como Target Method

#### Scenario: Method inexistente
- **WHEN** o renderer pede o Caller Graph de um `id` que não existe no
  Project carregado
- **THEN** a chamada falha com erro de Method não encontrado
